import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BuyNowButton } from '../components/BuyNowButton';
import { Chevron, Star } from '../components/Icons';
import { PromoCodeField } from '../components/PromoCodeField';
import { TaxHint } from '../components/TaxHint';
import { ProjectDetails } from '../components/ProjectDetails';
import { AppBadge, ProductCard, TierBadge } from '../components/ProductCard';
import { ReviewsPanel } from '../components/Reviews';
import { VideoPreview } from '../components/VideoPreview';
import { categoryById } from '../data/categories';
import { formatPrice, getProduct, related } from '../data/products';
import { discountedPrice, getActivePromo, type PromoInfo } from '../lib/promo';
import { useProductReviews } from '../lib/useProductReviews';
import { NotFound } from './NotFound';

export function ProductPage() {
  const { slug = '' } = useParams();
  const product = getProduct(slug);
  const [showReviews, setShowReviews] = useState(false);
  // Only a code the buyer typed and applied in the last 15 minutes is remembered — nothing is pre-filled from the account.
  const [promo, setPromo] = useState<PromoInfo | null>(getActivePromo);
  const reviewSummary = useProductReviews(product);

  useEffect(() => setShowReviews(false), [slug]);

  useEffect(() => {
    if (showReviews) document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [showReviews]);

  useEffect(() => {
    if (product) document.title = `${product.title} — Nuova Motion`;
  }, [product]);

  if (!product) return <NotFound />;

  const cat = categoryById(product.category);
  const purchasable = Boolean(product.whopPlanId);
  const activePromo = purchasable ? promo : null;

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
              <AppBadge category={product.category} />
              <TierBadge product={product} />
            </div>
            <h1>{product.title}</h1>
            <button
              type="button"
              className={`rating rating--btn ${showReviews ? 'is-open' : ''} ${reviewSummary.count > 0 ? '' : 'rating--empty'}`}
              onClick={() => setShowReviews((v) => !v)}
              aria-expanded={showReviews}
              aria-controls="reviews"
            >
              <Star width={15} height={15} />
              {reviewSummary.count > 0 ? (
                <>
                  {reviewSummary.rating.toFixed(1)}
                  <span className="muted">
                    · {reviewSummary.count.toLocaleString('en-US')} {reviewSummary.count === 1 ? 'review' : 'reviews'}
                  </span>
                </>
              ) : (
                <span className="muted">No reviews yet</span>
              )}
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
              <TaxHint align="start" />
            </div>

            {purchasable && <PromoCodeField value={promo} onChange={setPromo} />}

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
          {related(product, 3).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
