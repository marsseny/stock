import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
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
  /**
   * `price` — catalogue cards: a translucent glass pill that shows only the price and, on hover / focus,
   * smoothly widens to "price · Buy now". Default — the regular glass "Buy now" button (product page).
   */
  variant?: 'button' | 'price';
}

/** Opens the one-window checkout (e-mail + promo → Whop → ZIP) for this product. */
export function BuyNowButton({ product, promo = null, size = 'lg', block = false, variant = 'button' }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const purchasable = Boolean(product.whopPlanId);
  const final = formatPrice(discountedPrice(product.price, purchasable ? promo : null));

  if (variant === 'price') {
    const old = purchasable && promo ? formatPrice(product.price) : product.oldPrice ? formatPrice(product.oldPrice) : null;
    const inner = (
      <>
        <span className="price-btn__price">
          {old && <s>{old}</s>}
          <strong>{final}</strong>
        </span>
        <span className="price-btn__more" aria-hidden>
          <span className="price-btn__more-inner">
            <i className="price-btn__sep" />
            {purchasable ? (
              <>
                <Bag width={15} height={15} />
                Buy now
              </>
            ) : (
              'Coming soon'
            )}
          </span>
        </span>
      </>
    );

    if (!purchasable) {
      // Not on sale yet: the pill still expands, and leads to the project page.
      return (
        <Link to={`/item/${product.slug}`} className="price-btn" tabIndex={-1} aria-label={`${product.title} — ${final}, coming soon`}>
          {inner}
        </Link>
      );
    }

    return (
      <>
        <button
          type="button"
          className="price-btn"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Buy ${product.title} now for ${final}`}
        >
          {inner}
        </button>
        <CheckoutModal product={product} open={open} onClose={close} promo={promo} />
      </>
    );
  }

  if (!purchasable) {
    return (
      <button type="button" className={`btn btn--glass btn--${size} ${block ? 'btn--block' : ''}`} disabled title="This template is not on sale yet">
        Coming soon
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`btn btn--accent btn--${size} ${block ? 'btn--block' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Buy ${product.title} now for ${final}`}
      >
        <Bag width={size === 'sm' ? 16 : 18} height={size === 'sm' ? 16 : 18} />
        Buy now
      </button>
      <CheckoutModal product={product} open={open} onClose={close} promo={promo} />
    </>
  );
}
