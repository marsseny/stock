import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BuyNowButton } from '../components/BuyNowButton';
import { Check, Chevron, Close, Star, Ticket } from '../components/Icons';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProductCard, TierBadge } from '../components/ProductCard';
import { ReviewsPanel } from '../components/Reviews';
import { VideoPreview } from '../components/VideoPreview';
import { categoryById } from '../data/categories';
import { formatPrice, getProduct, related } from '../data/products';
import { discountedPrice, getActivePromo, lookupPromo, type PromoInfo } from '../lib/promo';
import { useProductReviews } from '../lib/useProductReviews';
import { NotFound } from './NotFound';

export function ProductPage() {
  const { slug = '' } = useParams();
  const product = getProduct(slug);
  const [showReviews, setShowReviews] = useState(false);
  // A promo saved after a previous purchase (fh_active_promo) is filled in and applied automatically.
  const [promo, setPromo] = useState<PromoInfo | null>(getActivePromo);
  const [promoInput, setPromoInput] = useState(() => getActivePromo()?.code ?? '');
  const [promoError, setPromoError] = useState('');
  const reviewSummary = useProductReviews(product);

  useEffect(() => setShowReviews(false), [slug]);

  useEffect(() => {
    if (showReviews) document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [showReviews]);

  useEffect(() => {
    if (product) document.title = `${product.title} — Framehaus`;
  }, [product]);

  if (!product) return <NotFound />;

  const cat = categoryById(product.category);
  const purchasable = Boolean(product.whopPlanId);
  const activePromo = purchasable ? promo : null;

  const applyPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) {
      setPromo(null);
      setPromoError('');
      return;
    }
    const found = lookupPromo(promoInput);
    setPromo(found);
    setPromoError(found ? '' : `“${promoInput.trim()}” is not a valid promo code.`);
  };

  const removePromo = () => {
    setPromo(null);
    setPromoInput('');
    setPromoError('');
  };
  // Per-project rows from src/data/product-specs.csv; otherwise the default rows below.
  const defaultSpecs: [string, string | undefined][] = [
    ['Application', product.compatibility],
    ['Resolution', product.resolution],
    ['Duration', product.duration],
    ['Items', product.itemsCount ? `${product.itemsCount}` : undefined],
    ['File size', product.fileSize],
    ['Plugins required', product.pluginsRequired ? 'Yes' : 'No'],
    ['Released', new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
  ];
  const specs: [string, string | undefined][] = product.specs?.length
    ? product.specs.map((s): [string, string] => [s.label, s.value])
    : defaultSpecs;

  return (
    <div className="section section--page">
      <nav className="crumbs muted" aria-label="Breadcrumb">
        <Link to="/">Home</Link> / <Link to={`/browse?cat=${cat.id}`}>{cat.label}</Link> / <span>{product.title}</span>
      </nav>

      <div className="product">
        <div className="product__main">
          <div className="product__media">
            <VideoPreview key={product.id} product={product} playing large controls />
          </div>

          <ProjectDetails product={product} />
        </div>

        <div className={`product__side ${showReviews ? 'is-expanded' : ''}`}>
          <aside className="buybox glass-panel">
            <div className="buybox__badges">
              <span className="badge badge--app">{cat.short}</span>
              <TierBadge product={product} />
            </div>
            <h1>{product.title}</h1>
            <button
              type="button"
              className={`rating rating--btn ${showReviews ? 'is-open' : ''}`}
              onClick={() => setShowReviews((v) => !v)}
              aria-expanded={showReviews}
              aria-controls="reviews"
            >
              <Star width={15} height={15} /> {reviewSummary.rating.toFixed(1)}
              <span className="muted">· {reviewSummary.count.toLocaleString('en-US')} reviews</span>
              <Chevron width={15} height={15} className="rating__chev" />
            </button>

            <div className="price price--lg">
              {activePromo ? (
                <>
                  <s>{formatPrice(product.price)}</s>
                  <strong>{formatPrice(discountedPrice(product.price, activePromo))}</strong>
                  <span className="promo-badge promo-badge--lg">-{activePromo.percent}%</span>
                </>
              ) : (
                <>
                  {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
                  <strong>{formatPrice(product.price)}</strong>
                </>
              )}
            </div>

            {purchasable && (
              <form className={`promo-field ${activePromo ? 'is-applied' : ''} ${promoError ? 'is-invalid' : ''}`} onSubmit={applyPromo}>
                <Ticket width={16} height={16} />
                <input
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    setPromoError('');
                  }}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={24}
                />
                {activePromo ? (
                  <>
                    <span className="promo-field__ok">
                      <Check width={14} height={14} /> {activePromo.code}
                    </span>
                    <button type="button" className="promo-field__btn" onClick={removePromo} aria-label="Remove promo code">
                      <Close width={14} height={14} />
                    </button>
                  </>
                ) : (
                  <button type="submit" className="promo-field__btn promo-field__btn--apply">
                    Apply
                  </button>
                )}
              </form>
            )}
            {promoError && (
              <small className="promo-field__error" role="alert">
                {promoError}
              </small>
            )}

            <BuyNowButton product={product} promo={activePromo} block />
            <small className="muted center">Lifetime license · commercial use · instant download</small>

            <dl className="specs">
              {specs
                .filter(([, v]) => v)
                .map(([k, v], i) => (
                  <div key={`${k}-${i}`}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
          </aside>

          {showReviews && <ReviewsPanel id="reviews" product={product} summary={reviewSummary} />}
        </div>
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
