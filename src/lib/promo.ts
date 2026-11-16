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

export const ACTIVE_PROMO_KEY = 'fh_active_promo';

/** Returns the promo for a code typed by the buyer, or `null` when the code is unknown. */
export function lookupPromo(raw: string): PromoInfo | null {
  const code = raw.trim().toUpperCase();
  const percent = PROMOS[code];
  return percent ? { code, percent } : null;
}

/** Promo the buyer unlocks after `purchasesCount` purchases (1 → NEXT15, 2+ → VIP20). */
export function promoForPurchases(purchasesCount: number): PromoInfo | null {
  if (purchasesCount >= 2) return { code: PROMO_THIRD, percent: 20 };
  if (purchasesCount === 1) return { code: PROMO_SECOND, percent: 15 };
  return null;
}

export function getActivePromo(): PromoInfo | null {
  try {
    const promo = lookupPromo(localStorage.getItem(ACTIVE_PROMO_KEY) ?? '');
    return isFreePromo(promo) ? null : promo;
  } catch {
    return null;
  }
}

export function saveActivePromo(code: string): void {
  try {
    const promo = lookupPromo(code);
    if (promo && !isFreePromo(promo)) localStorage.setItem(ACTIVE_PROMO_KEY, code.trim().toUpperCase());
  } catch {
    /* storage unavailable (private mode) — the code is still shown on screen */
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
