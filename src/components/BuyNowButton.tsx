import { useCallback, useState } from 'react';
import { formatPrice } from '../data/products';
import { discountedPrice, type PromoInfo } from '../lib/promo';
import type { Product } from '../types';
import { Bag } from './Icons';
import { CheckoutModal } from './CheckoutModal';

interface Props {
  product: Product;
  /** Promo applied to the price; pre-fills the promo field of the checkout. */
  promo?: PromoInfo | null;
  size?: 'sm' | 'lg';
  block?: boolean;
}

/** "Buy now" (the price is shown next to it) — opens the one-window checkout (e-mail + promo → Whop → ZIP) for this product. */
export function BuyNowButton({ product, promo = null, size = 'lg', block = false }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

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
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Buy ${product.title} now for ${label}`}
      >
        <Bag width={size === 'sm' ? 16 : 18} height={size === 'sm' ? 16 : 18} />
        Buy now
      </button>
      <CheckoutModal product={product} open={open} onClose={close} promo={promo} />
    </>
  );
}
