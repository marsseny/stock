/**
 * POST /api/claim-download
 * Body: { receiptId: string, planId: string, productSlug: string, email?: string }
 * Optional header: Authorization: Bearer <Supabase access token> — links the purchase to that account.
 *
 * Called by the storefront right after Whop checkout completes. Verifies the payment with the Whop API,
 * stores the purchase idempotently (the license key issued earlier by the webhook is kept), and returns
 * a fresh presigned R2 download link plus the next loyalty promo code.
 */

import { planBySlug } from '../../data/whopPlans';
import { optionalUser, type AuthUser } from '../auth';
import { getEnv } from '../env';
import { asString, createHandler, HttpError, isEmail, json, normalizeEmail, readJsonBody } from '../http';
import { nextPromoFor } from '../promo';
import { fileNameFromKey, getPresignedDownloadUrl } from '../r2';
import { countPaidPurchasesByEmail, countPurchasesByEmail, ensurePurchase, reassignPurchaseEmail } from '../supabaseAdmin';
import { fetchWhopPayment } from '../whop';

interface ClaimBody {
  receiptId: string;
  planId: string;
  productSlug: string;
  email: string;
}

export interface ClaimDownloadResponse {
  downloadUrl: string;
  licenseKey: string;
  email: string;
  fileName: string;
  totalPurchasesCount: number;
  nextPromoCode: string;
  nextDiscountPercent: number;
}

const DOWNLOAD_TTL_SECONDS = 3600;
const REASSIGN_WINDOW_MS = 60 * 60 * 1000;
const TEST_FALLBACK_EMAIL = 'test-buyer@framehaus.local';
const RECEIPT_RE = /^[A-Za-z0-9_-]{3,128}$/;

/** Unverified (no WHOP_API_KEY) claims are allowed only locally or when explicitly enabled. */
function testClaimsAllowed(req: Request): boolean {
  if (getEnv('ALLOW_TEST_CLAIMS') === 'true') return true;
  try {
    const host = new URL(req.url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  } catch {
    return false;
  }
}

async function resolveBuyerEmail(req: Request, receiptId: string, planId: string, fallbackEmail?: string): Promise<string> {
  if (!getEnv('WHOP_API_KEY')) {
    if (!testClaimsAllowed(req)) {
      throw new HttpError(503, 'payments_not_configured', 'Payment verification is not configured on the server.');
    }
    console.warn(`WHOP_API_KEY is empty — accepting unverified test claim for receipt ${receiptId}.`);
    return fallbackEmail && isEmail(fallbackEmail) ? normalizeEmail(fallbackEmail) : TEST_FALLBACK_EMAIL;
  }

  const payment = await fetchWhopPayment(receiptId);
  if (!payment) throw new HttpError(404, 'receipt_not_found', 'This receipt was not found at Whop.');
  if (!payment.paid) throw new HttpError(402, 'payment_not_completed', 'The payment has not been completed yet.');
  if (payment.planId && payment.planId !== planId) {
    throw new HttpError(400, 'plan_mismatch', 'The receipt belongs to a different product.');
  }
  // The e-mail typed into our checkout (also locked in the Whop form) wins over Whop's account e-mail,
  // so the file always lands where the buyer expects to find it in My Account.
  const email = (fallbackEmail && isEmail(fallbackEmail) ? fallbackEmail : undefined) ?? payment.email;
  if (!email) throw new HttpError(422, 'email_unavailable', 'Whop did not return the buyer e-mail for this receipt.');
  return normalizeEmail(email);
}

export const claimDownload = createHandler(['POST'], async (req) => {
  const body = await readJsonBody<ClaimBody>(req);
  const receiptId = asString(body.receiptId);
  const planId = asString(body.planId);
  const productSlug = asString(body.productSlug);
  const fallbackEmail = asString(body.email);

  if (!receiptId || !planId || !productSlug) {
    throw new HttpError(400, 'missing_fields', 'receiptId, planId and productSlug are required.');
  }
  if (!RECEIPT_RE.test(receiptId)) throw new HttpError(400, 'invalid_receipt', 'receiptId has an invalid format.');

  const product = planBySlug(productSlug);
  if (!product) throw new HttpError(404, 'product_not_found', 'This product is not available for purchase.');
  if (product.whopPlanId !== planId) throw new HttpError(400, 'plan_mismatch', 'planId does not match the product.');

  // A signed-in buyer (account created before checkout) owns the purchase even if a different
  // e-mail was typed into the Whop form. An expired token simply falls back to the checkout e-mail.
  let account: AuthUser | null = null;
  try {
    account = await optionalUser(req);
  } catch {
    account = null;
  }
  const paidEmail = await resolveBuyerEmail(req, receiptId, planId, account?.email ?? fallbackEmail);
  const email = account?.email ?? paidEmail;

  let purchase = await ensurePurchase({
    email,
    product_slug: product.slug,
    whop_plan_id: product.whopPlanId,
    whop_receipt_id: receiptId,
    r2_object_key: product.r2FileKey,
  });

  if (purchase.product_slug !== product.slug) {
    throw new HttpError(409, 'receipt_already_used', 'This receipt has already been used for another product.');
  }

  // The webhook may have stored the receipt under Whop's account e-mail — move it to the buyer's e-mail
  // (signed-in account or the one typed into our checkout). Only for fresh purchases, so an old receipt id
  // cannot be used to move someone else's purchase later.
  const isFresh = Date.now() - new Date(purchase.created_at).getTime() < REASSIGN_WINDOW_MS;
  if (purchase.email !== email && isFresh) {
    purchase = await reassignPurchaseEmail(purchase.id, email);
  }

  const totalPurchasesCount = await countPurchasesByEmail(purchase.email);
  const paidPurchasesCount = await countPaidPurchasesByEmail(purchase.email);
  const downloadUrl = await getPresignedDownloadUrl(purchase.r2_object_key, DOWNLOAD_TTL_SECONDS);

  const response: ClaimDownloadResponse = {
    downloadUrl,
    licenseKey: purchase.license_key,
    email: purchase.email,
    fileName: fileNameFromKey(purchase.r2_object_key),
    totalPurchasesCount,
    ...nextPromoFor(paidPurchasesCount),
  };
  return json(response);
});

export default claimDownload;
