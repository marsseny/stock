import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../data/products';
import { discountedPrice, lookupPromo, type PromoInfo } from '../lib/promo';
import type { Product } from '../types';
import { PENDING_CHECKOUT_KEY } from './AuthForm';
import { Bag } from './Icons';
import { CheckoutModal } from './CheckoutModal';

interface Props {
  product: Product;
  /** Promo applied to the price; pre-fills the promo field of the checkout. */
  promo?: PromoInfo | null;
  size?: 'sm' | 'lg';
  block?: boolean;
}

/** "Buy now · $XX" — opens the one-window checkout (e-mail/Google + promo → Whop → ZIP) for this product. */
export function BuyNowButton({ product, promo = null, size = 'lg', block = false }: Props) {
  const [open, setOpen] = useState(false);
  const [resumePromo, setResumePromo] = useState<PromoInfo | null>(null);
  const close = useCallback(() => setOpen(false), []);

  // Returning from "Continue with Google": re-open the checkout that started the sign-in (once).
  useEffect(() => {
    if (!product.whopPlanId) return;
    try {
      const pending = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
      if (!pending) return;
      const [slug, code = ''] = pending.split('|');
      if (slug !== product.slug) return;
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      setResumePromo(code ? lookupPromo(code) : null);
      setOpen(true);
    } catch {
      /* storage unavailable */
    }
  }, [product.slug, product.whopPlanId]);

  if (!product.whopPlanId) {
    return (
      <button type="button" className={`btn btn--glass btn--${size} ${block ? 'btn--block' : ''}`} disabled title="This template is not on sale yet">
        Coming soon
      </button>
    );
  }

  const label = formatPrice(discountedPrice(product.price, promo));

  return (
    <>
      <button
        type="button"
        className={`btn btn--accent btn--${size} ${block ? 'btn--block' : ''}`}
        onClick={() => {
          setResumePromo(null);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-label={`Buy ${product.title} now for ${label}`}
      >
        <Bag width={size === 'sm' ? 16 : 18} height={size === 'sm' ? 16 : 18} />
        Buy now · {label}
      </button>
      <CheckoutModal product={product} open={open} onClose={close} promo={resumePromo ?? promo} />
    </>
  );
}
