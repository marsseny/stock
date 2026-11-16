/** Loyalty promo codes offered after a purchase. */

import { getEnv } from './env';

export interface NextPromo {
  nextPromoCode: string;
  nextDiscountPercent: number;
}

/**
 * 1st purchase of an e-mail → 15% off the next one (NEXT15).
 * 2nd and later purchases   → 20% off (VIP20).
 * Codes can be renamed with PROMO_SECOND_ITEM / PROMO_THIRD_ITEM (or the VITE_ variants).
 */
export function nextPromoFor(totalPurchasesCount: number): NextPromo {
  if (totalPurchasesCount >= 2) {
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
