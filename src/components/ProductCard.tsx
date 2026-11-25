import { useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { categoryById } from '../data/categories';
import { formatPrice } from '../data/products';
import { discountedPrice, getActivePromo } from '../lib/promo';
import type { CategoryId, Product } from '../types';
import { BuyNowButton } from './BuyNowButton';
import { Layers } from './Icons';
import { VideoPreview } from './VideoPreview';

/**
 * "AE" badge that expands to "After Effects" on hover / focus.
 * Smooth: both labels are measured once (and again after web fonts load), then only the badge `width`
 * animates between the two exact pixel widths while the labels cross-fade — no `max-width` guessing,
 * no layout jumps. With `to`, it is also a link (the card's own link sits under it).
 */
export function AppBadge({ category, to }: { category: CategoryId; to?: string }) {
  const cat = categoryById(category);
  const ref = useRef<HTMLElement>(null);
  const [widths, setWidths] = useState<{ short: number; full: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const short = el.querySelector<HTMLElement>('.badge__short');
      const full = el.querySelector<HTMLElement>('.badge__full');
      if (!short || !full) return;
      const style = getComputedStyle(el);
      const chrome =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
      // Labels are absolutely positioned, so their box is the natural text width, independent of the animated badge width.
      const w = (node: HTMLElement) => Math.ceil(node.getBoundingClientRect().width + chrome);
      setWidths({ short: w(short), full: w(full) });
    };
    measure();
    let alive = true;
    void document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
    };
  }, [cat.short, cat.label]);

  const style = widths ? ({ '--badge-w-short': `${widths.short}px`, '--badge-w-full': `${widths.full}px` } as CSSProperties) : undefined;
  const className = `badge badge--app ${widths ? 'is-measured' : ''}`;
  const content = (
    <>
      <span className="badge__short" aria-hidden>
        {cat.short}
      </span>
      <span className="badge__full">{cat.label}</span>
    </>
  );
  return to ? (
    <Link ref={ref as RefObject<HTMLAnchorElement>} to={to} className={className} style={style} tabIndex={-1}>
      {content}
    </Link>
  ) : (
    <span ref={ref as RefObject<HTMLSpanElement>} className={className} style={style}>
      {content}
    </span>
  );
}

/** Only packs carry a badge ("Pack · N items"); there is no "Featured" badge. */
export function TierBadge({ product }: { product: Product }) {
  if (product.tier !== 'pack') return null;
  return (
    <span className="badge badge--pack">
      <Layers width={13} height={13} /> Pack · {product.itemsCount} items
    </span>
  );
}

/**
 * Catalogue card: only the 16:9 preview is visible. Title, price and "Buy now" fade in over the preview
 * on hover / keyboard focus (always shown on touch screens, which have no hover).
 * `large` — slightly bigger card used for the top projects in the first screen of the home page.
 */
export function ProductCard({ product, large = false }: { product: Product; large?: boolean }) {
  const [hover, setHover] = useState(false);
  // A code the buyer applied in the last 15 minutes (never an automatic one) is shown on card prices too.
  const [promo] = useState(getActivePromo);
  const activePromo = product.whopPlanId ? promo : null;

  return (
    <article
      className={`card ${large ? 'card--lg' : ''} ${hover ? 'is-hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e: FocusEvent<HTMLElement>) => e.currentTarget.contains(e.target) && setHover(true)}
      onBlur={(e: FocusEvent<HTMLElement>) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHover(false)}
    >
      <div className="card__media">
        <Link to={`/item/${product.slug}`} className="card__hit" aria-label={product.title} />
        <VideoPreview product={product} playing={hover} />

        <div className="card__overlay">
          <div className="card__badges">
            <TierBadge product={product} />
          </div>
          <div className="card__bar">
            <div className="card__info">
              <Link to={`/item/${product.slug}`} className="card__title" tabIndex={-1}>
                {product.title}
              </Link>
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
            </div>
            <BuyNowButton product={product} promo={activePromo} size="sm" />
          </div>
        </div>
      </div>
    </article>
  );
}
