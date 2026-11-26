import { useEffect, useState, type CSSProperties } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { VideoPreview } from './VideoPreview';

/** Auto-advance interval of the carousel (paused while the pointer is over it). */
const AUTO_MS = 7000;

/**
 * Top projects on the right of the home page's first screen: one large preview (a regular card — hover shows the
 * title and the price pill) and below it two rows of small, slightly wide banners without captions. Clicking a
 * banner swaps the large preview; the carousel also advances on its own until the visitor hovers it.
 */
export function TopCarousel({ products }: { products: Product[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = products[Math.min(active, products.length - 1)];

  useEffect(() => {
    if (paused || products.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === 'visible') setActive((i) => (i + 1) % products.length);
    }, AUTO_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, products.length]);

  if (!current) return null;

  return (
    <div
      className={`topc ${paused ? 'is-paused' : ''}`}
      aria-label="Top projects"
      style={{ '--topc-ms': `${AUTO_MS}ms` } as CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setPaused(false)}
    >
      <div className="topc__stage">
        <div className="topc__slide" key={current.id}>
          <ProductCard product={current} large />
        </div>
      </div>

      <div className="topc__thumbs" role="tablist" aria-label="Choose a top project">
        {products.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={p.title}
            className={`topc__thumb ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            {p.preview.poster ? (
              <img src={p.preview.poster} alt="" loading="lazy" decoding="async" />
            ) : (
              <VideoPreview product={p} playing={false} sound={false} />
            )}
            {i === active && <span className="topc__progress" aria-hidden key={`${p.id}-${active}`} />}
          </button>
        ))}
      </div>
    </div>
  );
}
