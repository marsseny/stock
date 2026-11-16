/**
 * POST /api/claim-free
 * Body: { productSlug: string, promoCode: string, email?: string }
 * Optional header: Authorization: Bearer <Supabase access token> — then the account e-mail is used.
 *
 * Delivers a product without Whop when the buyer applies the 100%-off code (TEST100 by default).
 * No account is required: the e-mail typed into the checkout is stored in `purchases`, so the file
 * shows up later in My Account after signing in with that e-mail.
 * The code is checked on the server; set FREE_PROMO_CODE to rename it or FREE_PROMO_DISABLED=true to turn it off.
 * Re-claiming the same product with the same e-mail returns the existing purchase and license key.
 */

import { planBySlug } from '../../data/whopPlans';
import { optionalUser } from '../auth';
import { getEnv } from '../env';
import { asString, createHandler, HttpError, isEmail, json, normalizeEmail, readJsonBody } from '../http';
import { nextPromoFor } from '../promo';
import { fileNameFromKey, getPresignedDownloadUrl } from '../r2';
import { countPurchasesByEmail, ensurePurchase, findPurchaseBySlugAndEmail } from '../supabaseAdmin';
import type { ClaimDownloadResponse } from './claimDownload';

const DOWNLOAD_TTL_SECONDS = 3600;

export function freePromoCode(): string | null {
  if (getEnv('FREE_PROMO_DISABLED') === 'true') return null;
  return (getEnv('FREE_PROMO_CODE') ?? getEnv('VITE_PROMO_FREE') ?? 'TEST100').toUpperCase();
}

export const claimFree = createHandler(['POST'], async (req) => {
  const body = await readJsonBody<{ productSlug: string; promoCode: string; email: string }>(req);
  const productSlug = asString(body.productSlug);
  const promoCode = asString(body.promoCode)?.toUpperCase();
  if (!productSlug || !promoCode) throw new HttpError(400, 'missing_fields', 'productSlug and promoCode are required.');

  const freeCode = freePromoCode();
  if (!freeCode || promoCode !== freeCode) throw new HttpError(400, 'invalid_promo', 'This promo code is not valid.');

  const product = planBySlug(productSlug);
  if (!product) throw new HttpError(404, 'product_not_found', 'This product is not available.');

  // A valid session wins; an expired one falls back to the typed e-mail.
  const account = await optionalUser(req).catch(() => null);
  const typed = asString(body.email);
  const email = account?.email ?? (typed && isEmail(typed) ? normalizeEmail(typed) : undefined);
  if (!email) throw new HttpError(400, 'invalid_email', 'Enter a valid e-mail address.');

  const purchase =
    (await findPurchaseBySlugAndEmail(product.slug, email)) ??
    (await ensurePurchase({
      email,
      product_slug: product.slug,
      whop_plan_id: product.whopPlanId,
      whop_receipt_id: `free_${crypto.randomUUID()}`,
      r2_object_key: product.r2FileKey,
    }));

  const totalPurchasesCount = await countPurchasesByEmail(purchase.email);
  const downloadUrl = await getPresignedDownloadUrl(purchase.r2_object_key, DOWNLOAD_TTL_SECONDS);

  const response: ClaimDownloadResponse = {
    downloadUrl,
    licenseKey: purchase.license_key,
    email: purchase.email,
    fileName: fileNameFromKey(purchase.r2_object_key),
    totalPurchasesCount,
    ...nextPromoFor(totalPurchasesCount),
  };
  return json(response);
});

export default claimFree;
