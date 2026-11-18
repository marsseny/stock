/**
 * Progressive loyalty promo codes (browser side).
 *
 *   NEXT15 → 15% off the 2nd product
 *   VIP20  → 20% off the 3rd and every following product
 *   TEST100 → 100% off (test code): Whop is skipped, the file is issued by POST /api/claim-free,
 *             which checks the same code on the server (FREE_PROMO_CODE / FREE_PROMO_DISABLED).
 *
 * The NEXT15 / VIP20 discounts are applied by Whop: the same codes must exist in the Whop dashboard for the plan.
 * The storefront only previews the reduced price, copies the code and pre-fills it in the embedded checkout.
 */

export const PROMO_SECOND = (import.meta.env.VITE_PROMO_SECOND_ITEM?.trim() || 'NEXT15').toUpperCase();
export const PROMO_THIRD = (import.meta.env.VITE_PROMO_THIRD_ITEM?.trim() || 'VIP20').toUpperCase();
export const PROMO_FREE = (import.meta.env.VITE_PROMO_FREE?.trim() || 'TEST100').toUpperCase();

export interface PromoInfo {
  code: string;
  percent: number;
}

const PROMOS: Record<string, number> = { [PROMO_SECOND]: 15, [PROMO_THIRD]: 20, [PROMO_FREE]: 100 };

/** A 100%-off code: the product is delivered without the Whop checkout. */
export const isFreePromo = (promo: PromoInfo | null | undefined): boolean => Boolean(promo && promo.percent >= 100);

/**
 * Applied promo memory. A code is NEVER filled in automatically from the buyer's account or purchases —
 * the buyer types it. Once applied, it is remembered for 15 minutes (renewed on every use) so it survives
 * page changes and the Google sign-in redirect, then it is forgotten. After a completed order it is cleared.
 */
export const APPLIED_PROMO_KEY = 'fh_promo_applied';
/** Older builds saved the loyalty code here permanently and pre-filled it — removed on load. */
const LEGACY_PROMO_KEY = 'fh_active_promo';
export const PROMO_TTL_MS = 15 * 60 * 1000;

try {
  localStorage.removeItem(LEGACY_PROMO_KEY);
} catch {
  /* storage unavailable */
}

export function getActivePromo(): PromoInfo | null {
  try {
    const raw = localStorage.getItem(APPLIED_PROMO_KEY);
    if (!raw) return null;
    const { code, exp } = JSON.parse(raw) as { code?: string; exp?: number };
    const promo = lookupPromo(code ?? '');
    if (!promo || !exp || exp < Date.now() || isFreePromo(promo)) {
      localStorage.removeItem(APPLIED_PROMO_KEY);
      return null;
    }
    return promo;
  } catch {
    return null;
  }
}

/** Remembers a code the buyer applied (15 minutes). Free (100%) test codes are never remembered. */
export function saveActivePromo(code: string): void {
  try {
    const promo = lookupPromo(code);
    if (promo && !isFreePromo(promo)) {
      localStorage.setItem(APPLIED_PROMO_KEY, JSON.stringify({ code: promo.code, exp: Date.now() + PROMO_TTL_MS }));
    }
  } catch {
    /* storage unavailable (private mode) — the code still works on this page */
  }
}

export function clearActivePromo(): void {
  try {
    localStorage.removeItem(APPLIED_PROMO_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Discounted price rounded to cents. */
export function discountedPrice(price: number, promo: PromoInfo | null): number {
  if (!promo) return price;
  return Math.round(price * (100 - promo.percent)) / 100;
}

/** Copies text to the clipboard; resolves to `false` when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
