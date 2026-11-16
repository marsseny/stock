/**
 * GET  /api/reviews?slug=<product>            — public reviews of a product (no e-mails exposed)
 * GET  /api/reviews?mine=1 + Bearer token      — reviews written by the signed-in buyer
 * POST /api/reviews + Bearer token             — { productSlug, rating: 1..5, comment? } create/update own review
 *
 * Only buyers who own the product (a row in `purchases` with their e-mail) can review it; one review per product.
 */

import { requireUser } from '../auth';
import { asString, createHandler, HttpError, json, readJsonBody } from '../http';
import { findPurchaseBySlugAndEmail, listReviewsByEmail, listReviewsBySlug, upsertReview, type ReviewRow } from '../supabaseAdmin';

export const MAX_COMMENT_LENGTH = 500;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

export interface PublicReview {
  id: string;
  productSlug: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

const toPublic = (r: ReviewRow): PublicReview => ({
  id: r.id,
  productSlug: r.product_slug,
  author: r.author_name,
  rating: r.rating,
  comment: r.comment,
  date: r.updated_at || r.created_at,
});

export const reviews = createHandler(['GET', 'POST'], async (req) => {
  if (req.method.toUpperCase() === 'GET') {
    const params = new URL(req.url).searchParams;
    if (params.get('mine')) {
      const user = await requireUser(req);
      return json({ reviews: (await listReviewsByEmail(user.email)).map(toPublic) });
    }
    const slug = asString(params.get('slug'));
    if (!slug || !SLUG_RE.test(slug)) throw new HttpError(400, 'invalid_slug', 'slug is required.');
    return json({ reviews: (await listReviewsBySlug(slug)).map(toPublic) });
  }

  const user = await requireUser(req);
  const body = await readJsonBody<{ productSlug: string; rating: number; comment: string }>(req);
  const productSlug = asString(body.productSlug);
  const rating = Number(body.rating);
  const comment = (typeof body.comment === 'string' ? body.comment : '').trim();

  if (!productSlug || !SLUG_RE.test(productSlug)) throw new HttpError(400, 'invalid_slug', 'productSlug is required.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'invalid_rating', 'Rating must be 1–5 stars.');
  if (comment.length > MAX_COMMENT_LENGTH) {
    throw new HttpError(400, 'comment_too_long', `Keep the comment under ${MAX_COMMENT_LENGTH} characters.`);
  }

  const owned = await findPurchaseBySlugAndEmail(productSlug, user.email);
  if (!owned) throw new HttpError(403, 'not_purchased', 'Only buyers of this project can review it.');

  const saved = await upsertReview({
    product_slug: productSlug,
    email: user.email,
    author_name: user.displayName,
    rating,
    comment,
  });
  return json({ review: toPublic(saved) });
});

export default reviews;
