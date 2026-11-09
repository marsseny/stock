import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bag, Check, Layers } from '../components/Icons';
import { Badges, ProductCard } from '../components/ProductCard';
import { Rating } from '../components/Rating';
import { VideoPreview } from '../components/VideoPreview';
import { categoryById } from '../data/categories';
import { formatPrice, getProduct, related } from '../data/products';
import { useCart } from '../store/cart';
import { NotFound } from './NotFound';

export function ProductPage() {
  const { slug = '' } = useParams();
  const product = getProduct(slug);
  const cart = useCart();

  useEffect(() => {
    if (product) document.title = `${product.title} — Framehaus`;
  }, [product]);

  if (!product) return <NotFound />;

  const cat = categoryById(product.category);
  const inCart = cart.has(product.id);
  const specs: [string, string | undefined][] = [
    ['Application', product.compatibility],
    ['Resolution', product.resolution],
    ['Duration', product.duration],
    ['Items', product.itemsCount ? `${product.itemsCount}` : undefined],
    ['File size', product.fileSize],
    ['Plugins required', product.pluginsRequired ? 'Yes' : 'No'],
    ['Released', new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
  ];

  return (
    <div className="section section--page">
      <nav className="crumbs muted" aria-label="Breadcrumb">
        <Link to="/">Home</Link> / <Link to={`/browse?cat=${cat.id}`}>{cat.label}</Link> / <span>{product.title}</span>
      </nav>

      <div className="product">
        <div className="product__main">
          <div className={`product__media ${product.tier === 'pack' ? 'card--pack' : ''}`}>
            <VideoPreview product={product} playing large />
          </div>

          <div className="product__about">
            <h2>About this {product.tier === 'pack' ? 'pack' : 'template'}</h2>
            <p>{product.description}</p>

            {product.includes && (
              <>
                <h3>
                  <Layers width={16} height={16} /> What’s inside
                </h3>
                <ul className="includes">
                  {product.includes.map((i) => (
                    <li key={i}>
                      <Check width={14} height={14} /> {i}
                    </li>
                  ))}
                  <li className="muted">+ {product.itemsCount! - product.includes.length} more elements</li>
                </ul>
              </>
            )}

            <h3>Tags</h3>
            <div className="chips">
              {product.tags.map((t) => (
                <Link key={t} to={`/browse?tag=${encodeURIComponent(t)}`} className="chip">
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <aside className="buybox glass-panel">
          <div className="buybox__badges">
            <Badges product={product} />
          </div>
          <h1>{product.title}</h1>
          <p className="muted">{product.summary}</p>
          <Rating rating={product.rating} size={15} label="long" />
          <p className="muted small">
            by <b>{product.author}</b>
          </p>

          <div className="price price--lg">
            {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
            <strong>{formatPrice(product.price)}</strong>
          </div>

          <button
            className="btn btn--glass btn--lg btn--block"
            onClick={() => (inCart ? cart.open() : cart.add(product))}
          >
            {inCart ? <Check /> : <Bag />} {inCart ? 'In cart — view' : 'Add to cart'}
          </button>
          <small className="muted center">Lifetime license · commercial use · instant download</small>

          <dl className="specs">
            {specs
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </aside>
      </div>

      <section className="section">
        <div className="section__head">
          <h2>You may also like</h2>
        </div>
        <div className="grid">
          {related(product).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
