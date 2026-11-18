/**
 * Reviews are never generated: every star rating and comment on the site comes from a real buyer
 * (table `reviews`, written by POST /api/reviews only for e-mails that paid for the product).
 * A new product starts with 0 reviews. See `src/lib/useProductReviews.ts`.
 */

export const formatReviewDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
