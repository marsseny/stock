/**
 * GET  /api/get-download-url?purchaseId=<uuid>
 * POST /api/get-download-url  { purchaseId }
 * Header: Authorization: Bearer <Supabase access token>
 *
 * Re-issues a fresh presigned R2 link for a purchase that belongs to the signed-in user (matched by e-mail).
 */

import { asString, createHandler, HttpError, json, readJsonBody } from '../http';
import { fileNameFromKey, getPresignedDownloadUrl } from '../r2';
import { requireUser } from '../auth';
import { findPurchaseById } from '../supabaseAdmin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOWNLOAD_TTL_SECONDS = 3600;

async function readPurchaseId(req: Request): Promise<string | undefined> {
  if (req.method.toUpperCase() === 'GET') return asString(new URL(req.url).searchParams.get('purchaseId'));
  const body = await readJsonBody<{ purchaseId: string }>(req);
  return asString(body.purchaseId);
}

export const getDownloadUrl = createHandler(['GET', 'POST'], async (req) => {
  const user = await requireUser(req);

  const purchaseId = await readPurchaseId(req);
  if (!purchaseId || !UUID_RE.test(purchaseId)) throw new HttpError(400, 'invalid_purchase_id', 'purchaseId is required.');

  const userEmail = user.email;

  const purchase = await findPurchaseById(purchaseId);
  if (!purchase || purchase.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new HttpError(404, 'purchase_not_found', 'Purchase not found.');
  }

  const downloadUrl = await getPresignedDownloadUrl(purchase.r2_object_key, DOWNLOAD_TTL_SECONDS);
  return json({ downloadUrl, fileName: fileNameFromKey(purchase.r2_object_key), expiresIn: DOWNLOAD_TTL_SECONDS });
});

export default getDownloadUrl;
