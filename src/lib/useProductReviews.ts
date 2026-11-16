import { useEffect, useMemo, useState } from 'react';
import { getReviews } from '../data/reviews';
import type { Product, Review } from '../types';
import { fetchProductReviews } from './api';

export interface ReviewSummary {
  reviews: Review[];
  rating: number;
  count: number;
}

/**
 * Reviews shown on the product page: real buyer reviews from /api/reviews first (newest first),
 * followed by the catalog's mock reviews. Rating and count include both.
 * If the API is unavailable the page falls back to the mock reviews only.
 */
export function useProductReviews(product: Product | undefined): ReviewSummary {
  const [live, setLive] = useState<Review[]>([]);
  const slug = product?.slug;

  useEffect(() => {
    setLive([]);
    if (!slug) return;
    let cancelled = false;
    fetchProductReviews(slug)
      .then((list) => {
        if (cancelled) return;
        setLive(
          list.map((r) => ({ id: r.id, author: r.author, rating: r.rating, date: r.date, text: r.comment, verified: true })),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return useMemo(() => {
    if (!product) return { reviews: [], rating: 0, count: 0 };
    const mock = getReviews(product);
    const count = product.reviewsCount + live.length;
    const sum = product.rating * product.reviewsCount + live.reduce((a, r) => a + r.rating, 0);
    return { reviews: [...live, ...mock], rating: count ? sum / count : product.rating, count };
  }, [product, live]);
}
