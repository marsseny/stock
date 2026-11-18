import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { formatPrice } from '../data/products';
import { discountedPrice, lookupPromo, type PromoInfo } from '../lib/promo';
import type { Product } from '../types';
import { clearPendingCheckout, readPendingCheckout } from '../lib/pendingCheckout';
import { Bag } from './Icons';
import { CheckoutModal } from './CheckoutModal';

interface Props {
  product: Product;
  /** Promo applied to the price; pre-fills the promo field of the checkout. */
  promo?: PromoInfo | null;
  size?: 'sm' | 'lg';
  block?: boolean;
}

/** "Buy now" (the price is shown next to it) — opens the one-window checkout (e-mail/Google + promo → Whop → ZIP) for this product. */
export function BuyNowButton({ product, promo = null, size = 'lg', block = false }: Props) {
  const [open, setOpen] = useState(false);
  const [resumePromo, setResumePromo] = useState<PromoInfo | null>(null);
  const close = useCallback(() => setOpen(false), []);

  const { pathname } = useLocation();

  // Returning from "Continue with Google": re-open the checkout that started the sign-in (once),
  // only on the page where it was opened (cards for the same product elsewhere stay closed).
  useEffect(() => {
    if (!product.whopPlanId) return;
    const pending = readPendingCheckout();
    if (!pending || pending.slug !== product.slug || pending.path !== pathname) return;
    clearPendingCheckout();
    setResumePromo(pending.promo ? lookupPromo(pending.promo) : null);
    setOpen(true);
  }, [product.slug, product.whopPlanId, pathname]);

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
        Buy now
      </button>
      <CheckoutModal product={product} open={open} onClose={close} promo={resumePromo ?? promo} />
    </>
  );
}
