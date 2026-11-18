/** Loyalty promo codes offered after a purchase. */

import { getEnv } from './env';

export interface NextPromo {
  nextPromoCode: string;
  nextDiscountPercent: number;
}

/**
 * Counts PAID purchases only (free files never unlock a code):
 * 0 paid purchases          → no code (empty string, 0%).
 * 1st paid purchase         → 15% off the next one (NEXT15).
 * 2nd and later purchases   → 20% off (VIP20).
 * Codes can be renamed with PROMO_SECOND_ITEM / PROMO_THIRD_ITEM (or the VITE_ variants).
 */
export function nextPromoFor(paidPurchasesCount: number): NextPromo {
  if (paidPurchasesCount <= 0) return { nextPromoCode: '', nextDiscountPercent: 0 };
  if (paidPurchasesCount >= 2) {
    return {
      nextPromoCode: getEnv('PROMO_THIRD_ITEM') ?? getEnv('VITE_PROMO_THIRD_ITEM') ?? 'VIP20',
      nextDiscountPercent: 20,
    };
  }
  return {
    nextPromoCode: getEnv('PROMO_SECOND_ITEM') ?? getEnv('VITE_PROMO_SECOND_ITEM') ?? 'NEXT15',
    nextDiscountPercent: 15,
  };
}
