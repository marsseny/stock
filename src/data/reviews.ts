import type { Product, Review } from '../types';

/**
 * Mock buyer reviews, generated deterministically per product so they stay stable between reloads.
 * Replace `getReviews` with real data later — the product page only uses this function.
 */

const NAMES = [
  'Maya R.', 'Daniel K.', 'Sofia M.', 'Lukas B.', 'Aiko T.', 'Omar H.', 'Elena V.', 'Jonas P.',
  'Priya S.', 'Marco D.', 'Chloe L.', 'Igor N.', 'Hannah W.', 'Mateo G.', 'Yuki A.', 'Nina F.',
  'Theo C.', 'Zara Q.', 'Felix O.', 'Lena J.',
];

const GREAT = [
  'Exactly what I needed for a client promo. Swapped the media and text in under an hour and the result looked premium.',
  'Super clean project structure — every comp is labeled and the color controls are all on one panel. Rendered without a single issue.',
  'The tutorial is short and actually useful. I had never used a template this size before and finished my edit the same evening.',
  'Animations are smooth and the timing feels hand-crafted, not generic. My client asked who made the motion design.',
  'Great value. I have already reused it on three different projects just by changing the palette.',
  'Fast support from the author when I had a font question. Template itself works perfectly in the latest version.',
  'Drag-and-drop really means drag-and-drop here. Placeholders resize nicely for both photos and video clips.',
  'Looks even better than the preview once you put your own footage in. Highly recommend.',
];

const GOOD = [
  'Very solid template. Took me a bit to find the global controls, but once I did everything was easy.',
  'Nice design and tidy layers. Render times are a little long on my laptop, but the result is worth it.',
  'Good pack overall — a few elements I will never use, but the main ones are excellent.',
  'Works as described. Would love a couple more color presets in a future update.',
];

const OK = ['Decent, but I needed a free plugin that I missed in the description. Read the requirements first.'];

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const cache = new Map<string, Review[]>();

export function getReviews(product: Product): Review[] {
  const hit = cache.get(product.id);
  if (hit) return hit;

  const rand = seeded([...product.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const start = Date.UTC(2026, 10, 9);
  const reviews: Review[] = [];
  let daysAgo = 1;

  for (let i = 0; i < product.reviewsCount; i++) {
    const r = rand();
    // Distribution leans toward the product's overall rating.
    const fiveShare = Math.min(0.95, Math.max(0.35, (product.rating - 4) * 0.9 + 0.1));
    const rating = r < fiveShare ? 5 : r < 0.97 ? 4 : 3;
    daysAgo += 1 + Math.floor(rand() * 9);
    reviews.push({
      id: `${product.id}-r${i + 1}`,
      author: pick(NAMES),
      rating,
      date: new Date(start - daysAgo * 86_400_000).toISOString(),
      text: pick(rating === 5 ? GREAT : rating === 4 ? GOOD : OK),
    });
  }

  cache.set(product.id, reviews);
  return reviews;
}

export const formatReviewDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
