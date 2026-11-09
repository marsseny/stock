import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryById } from '../data/categories';
import { formatPrice } from '../data/products';
import { useCart } from '../store/cart';
import type { Product } from '../types';
import { Bag, Check, Layers } from './Icons';
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
  const cart = useCart();
  const inCart = cart.has(product.id);
  const cat = categoryById(product.category);

  return (
    <article
      className={`card card--${product.tier}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <Link to={`/item/${product.slug}`} className="card__media" aria-label={product.title}>
        {product.tier === 'pack' && <div className="card__stack" aria-hidden />}
        <VideoPreview product={product} playing={hover} />
        <div className="card__badges">
          <span className="badge badge--app">{cat.short}</span>
          <TierBadge product={product} />
        </div>
      </Link>

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
            {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
            <strong>{formatPrice(product.price)}</strong>
          </div>
          <button
            className={`btn btn--glass btn--sm ${inCart ? 'is-done' : ''}`}
            onClick={() => (inCart ? cart.open() : cart.add(product))}
            aria-label={inCart ? 'In cart' : `Add ${product.title} to cart`}
          >
            {inCart ? <Check width={16} height={16} /> : <Bag width={16} height={16} />}
            {inCart ? 'In cart' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
