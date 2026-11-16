import { useState, type FocusEvent } from 'react';
import { Link } from 'react-router-dom';
import { categoryById } from '../data/categories';
import { formatPrice } from '../data/products';
import { discountedPrice, getActivePromo } from '../lib/promo';
import type { Product } from '../types';
import { BuyNowButton } from './BuyNowButton';
import { Layers } from './Icons';
import { VideoPreview } from './VideoPreview';

export function TierBadge({ product }: { product: Product }) {
  if (product.tier === 'featured') return <span className="badge badge--featured">Featured</span>;
  if (product.tier === 'pack')
    return (
      <span className="badge badge--pack">
        <Layers width={13} height={13} /> Pack · {product.itemsCount} items
      </span>
    );
  return null;
}

export function ProductCard({ product }: { product: Product }) {
  const [hover, setHover] = useState(false);
  // Promo saved after a previous purchase (fh_active_promo) is applied to card prices too.
  const [promo] = useState(getActivePromo);
  const activePromo = product.whopPlanId ? promo : null;
  const cat = categoryById(product.category);

  return (
    <article
      className={`card card--${product.tier}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e: FocusEvent<HTMLElement>) => e.currentTarget.contains(e.target) && setHover(true)}
      onBlur={(e: FocusEvent<HTMLElement>) => e.currentTarget.contains(e.target) && setHover(false)}
    >
      <div className="card__media">
        <Link to={`/item/${product.slug}`} className="card__hit" aria-label={product.title} />
        <VideoPreview product={product} playing={hover} />
        <div className="card__badges">
          <span className="badge badge--app">{cat.short}</span>
          <TierBadge product={product} />
        </div>
      </div>

      <div className="card__body">
        <div className="card__info">
          <Link to={`/item/${product.slug}`} className="card__title">
            {product.title}
          </Link>
          <div className="card__sub">
            <span>{cat.label}</span>
            <span className="dot" />
            <span>by {product.author}</span>
          </div>
          <div className="card__tags">
            {product.tags.slice(0, 4).map((t) => (
              <Link key={t} to={`/browse?tag=${encodeURIComponent(t)}`} className="tag">
                {t}
              </Link>
            ))}
          </div>
        </div>
        <div className="card__buy">
          <div className="price">
            {activePromo ? (
              <>
                <span className="promo-badge">-{activePromo.percent}%</span>
                <s>{formatPrice(product.price)}</s>
                <strong>{formatPrice(discountedPrice(product.price, activePromo))}</strong>
              </>
            ) : (
              <>
                {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
                <strong>{formatPrice(product.price)}</strong>
              </>
            )}
          </div>
          <BuyNowButton product={product} promo={activePromo} size="sm" />
        </div>
      </div>
    </article>
  );
}
