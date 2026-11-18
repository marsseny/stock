/**
 * Checkout that must re-open after "Continue with Google".
 *
 * Before the OAuth redirect the checkout stores the product, the page it was opened on and the promo the
 * buyer typed. Supabase sends the buyer back to `redirectTo` (the same page) — or, when that URL is not in
 * Supabase → Auth → URL Configuration → Redirect URLs, to the Site URL (home). `ResumePendingCheckout`
 * (App layout) then routes back to the original page and `BuyNowButton` re-opens the same checkout,
 * so the buyer never ends up on the home page. Entries expire after 15 minutes.
 */

const KEY = 'fh_pending_checkout';
const TTL_MS = 15 * 60 * 1000;

export interface PendingCheckout {
  slug: string;
  /** Pathname where the checkout was opened, e.g. `/item/phone-20-pro-mockups` or `/`. */
  path: string;
  /** Promo the buyer typed (may be empty). */
  promo: string;
  ts: number;
}

export function savePendingCheckout(entry: Omit<PendingCheckout, 'ts'>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...entry, ts: Date.now() }));
  } catch {
    /* storage unavailable — the buyer just clicks Buy now again after returning */
  }
}

export function readPendingCheckout(): PendingCheckout | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    let entry: PendingCheckout;
    if (raw.startsWith('{')) entry = JSON.parse(raw) as PendingCheckout;
    else {
      // Older format: `slug|PROMO`, always started on the product page.
      const [slug, promo = ''] = raw.split('|');
      entry = { slug, promo, path: `/item/${slug}`, ts: Date.now() };
    }
    if (!entry.slug || !entry.path || Date.now() - entry.ts > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
