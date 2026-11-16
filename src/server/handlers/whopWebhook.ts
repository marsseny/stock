/**
 * POST /api/whop-webhook
 *
 * Receives Whop webhooks. On `payment.succeeded` it records the purchase idempotently
 * (`ON CONFLICT (whop_receipt_id) DO NOTHING`), so the license key exists even if the buyer
 * closes the tab before /api/claim-download is called. Other events are acknowledged and ignored.
 */

import { planByWhopId } from '../../data/whopPlans';
import { getEnv } from '../env';
import { createHandler, HttpError, isEmail, json, normalizeEmail } from '../http';
import { ensurePurchase } from '../supabaseAdmin';
import { fetchWhopPayment, normalizeWhopPayment, verifyWhopWebhook } from '../whop';

const HANDLED_EVENTS = new Set(['payment.succeeded', 'payment_succeeded', 'app_payment_succeeded']);

function eventName(payload: Record<string, unknown>): string {
  const value = payload.type ?? payload.action ?? payload.event;
  return typeof value === 'string' ? value : '';
}

export const whopWebhook = createHandler(['POST'], async (req) => {
  const rawBody = await req.text();

  if (!(await verifyWhopWebhook(req.headers, rawBody))) {
    throw new HttpError(401, 'invalid_signature', 'Webhook signature verification failed.');
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    payload = parsed as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Webhook body must be a JSON object.');
  }

  const event = eventName(payload);
  if (!HANDLED_EVENTS.has(event)) return json({ received: true, ignored: event || 'unknown' });

  let payment = normalizeWhopPayment(payload.data);
  if (!payment) throw new HttpError(400, 'invalid_payload', 'payment.succeeded without a payment object.');

  // Without a signing secret the payload is untrusted: confirm it with the Whop API when possible.
  // The API is also used to fill in a missing e-mail / plan id.
  const hasApiKey = Boolean(getEnv('WHOP_API_KEY'));
  if (hasApiKey && (!getEnv('WHOP_WEBHOOK_SECRET') || !payment.email || !payment.planId)) {
    const confirmed = await fetchWhopPayment(payment.id);
    if (!confirmed) throw new HttpError(404, 'receipt_not_found', 'Payment from the webhook was not found at Whop.');
    payment = {
      ...confirmed,
      email: confirmed.email ?? payment.email,
      planId: confirmed.planId ?? payment.planId,
    };
    if (!confirmed.paid) return json({ received: true, skipped: 'payment_not_paid' });
  }

  if (!payment.planId) return json({ received: true, skipped: 'missing_plan_id' });
  const product = planByWhopId(payment.planId);
  if (!product) return json({ received: true, skipped: 'unknown_plan', planId: payment.planId });

  if (!payment.email || !isEmail(payment.email)) {
    // Acknowledge so Whop does not retry forever; /api/claim-download will create the record later.
    console.warn(`Whop webhook ${payment.id}: buyer e-mail is missing, purchase not recorded yet.`);
    return json({ received: true, skipped: 'missing_email' }, 202);
  }

  const purchase = await ensurePurchase({
    email: normalizeEmail(payment.email),
    product_slug: product.slug,
    whop_plan_id: product.whopPlanId,
    whop_receipt_id: payment.id,
    r2_object_key: product.r2FileKey,
  });

  return json({ received: true, purchaseId: purchase.id });
});

export default whopWebhook;
