import type { RatingStats } from '../types';
import { hashString, mulberry32 } from './random';

const DAY = 86_400_000;

/**
 * Simulated reviews: every day since release each product receives 0–3 new ratings (1–5 stars),
 * seeded by product id + day, so the numbers are stable within a day and grow day by day.
 * `popularity` scales how many ratings arrive per day.
 */
export function computeRating(id: string, createdAt: string, popularity = 1, now = Date.now()): RatingStats {
  const seed = hashString(id);
  // Per-product quality in [0, 1): shifts the score distribution so averages differ between products.
  const quality = mulberry32(seed)();
  const p5 = 0.45 + 0.3 * quality;
  const p4 = p5 + 0.3;
  const p3 = p4 + (1 - p4) * 0.55;
  const p2 = p3 + (1 - p3) * 0.55;
  const score = (r: number) => (r < p5 ? 5 : r < p4 ? 4 : r < p3 ? 3 : r < p2 ? 2 : 1);

  const firstDay = Math.floor(Date.parse(createdAt) / DAY);
  const today = Math.floor(now / DAY);
  let sum = 0;
  let count = 0;

  for (let day = firstDay; day <= today; day++) {
    const rand = mulberry32(seed ^ Math.imul(day, 2654435761));
    const r = rand();
    let n = r < 0.35 ? 0 : r < 0.7 ? 1 : r < 0.9 ? 2 : 3;
    if (day === firstDay) n += 3; // launch-day reviews
    n = Math.round(n * popularity);
    for (let i = 0; i < n; i++) {
      sum += score(rand());
      count++;
    }
  }

  return { average: count ? Math.round((sum / count) * 10) / 10 : 0, count };
}
