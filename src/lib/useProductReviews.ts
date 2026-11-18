import { useEffect, useMemo, useState } from 'react';
import type { Product, Review } from '../types';
import { fetchProductReviews } from './api';

export interface ReviewSummary {
  reviews: Review[];
  /** Average of real buyer ratings; 0 when there are none. */
  rating: number;
  count: number;
  loading: boolean;
}

/**
 * Reviews shown on the product page: only real buyer reviews from /api/reviews (newest first).
 * Every review counts equally — stars-only and stars + comment alike. No mock or generated ratings:
 * a new product shows "No reviews yet" until its first buyer rates it.
 */
export function useProductReviews(product: Product | undefined): ReviewSummary {
  const [live, setLive] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const slug = product?.slug;

  useEffect(() => {
    setLive([]);
    if (!slug) return;
    setLoading(true);
    let cancelled = false;
    fetchProductReviews(slug)
      .then((list) => {
        if (cancelled) return;
        setLive(list.map((r) => ({ id: r.id, author: r.author, rating: r.rating, date: r.date, text: r.comment })));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return useMemo(() => {
    const count = live.length;
    const rating = count ? live.reduce((a, r) => a + r.rating, 0) / count : 0;
    return { reviews: live, rating, count, loading };
  }, [live, loading]);
}
