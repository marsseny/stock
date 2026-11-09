import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryById } from '../data/categories';
import { formatPrice } from '../data/products';
import { useCart } from '../store/cart';
import type { Product } from '../types';
import { Bag, Check, Layers } from './Icons';
import { Rating } from './Rating';
import { VideoPreview } from './VideoPreview';

export function Badges({ product }: { product: Product }) {
  return (
    <>
      <span className="badge">{categoryById(product.category).label}</span>
      {product.tier === 'featured' && <span className="badge">Featured</span>}
      {product.tier === 'pack' && (
        <span className="badge">
          <Layers width={13} height={13} /> Pack · {product.itemsCount} items
        </span>
      )}
    </>
  );
}

interface Props {
  product: Product;
  /** Play the preview without hover (active carousel slide). */
  autoPlay?: boolean;
}

/** Preview-only card; title, summary, tags, price and buy button appear over the preview on hover. */
export function ProductCard({ product, autoPlay }: Props) {
  const [hover, setHover] = useState(false);
  const cart = useCart();
  const inCart = cart.has(product.id);
  const href = `/item/${product.slug}`;

  return (
    <article
      className={`card card--${product.tier}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="card__media">
        {product.tier === 'pack' && <div className="card__stack" aria-hidden />}
        <VideoPreview product={product} playing={hover || !!autoPlay} />
        <Link to={href} className="card__link" aria-label={product.title} draggable={false} />

        <div className="card__badges">
          <Badges product={product} />
        </div>

        <div className="card__overlay">
          <div className="card__info">
            <div className="card__head">
              <Link to={href} className="card__title" draggable={false}>
                {product.title}
              </Link>
              <Rating rating={product.rating} />
            </div>
            <p className="card__desc">{product.summary}</p>
            <div className="card__tags">
              {product.tags.slice(0, 4).map((t) => (
                <Link key={t} to={`/browse?tag=${encodeURIComponent(t)}`} className="tag" draggable={false}>
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
              aria-label={inCart ? 'In cart' : `Buy ${product.title}`}
            >
              {inCart ? <Check width={16} height={16} /> : <Bag width={16} height={16} />}
              {inCart ? 'In cart' : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
