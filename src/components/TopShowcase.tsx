import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { VideoPreview } from './VideoPreview';

/** Time each top project stays in the large preview before the next one comes in. */
const AUTO_MS = 7000;

/**
 * Right half of the home first screen: one large preview of a top project and, below it, two rows of
 * three small wide banners (no captions). Clicking a banner swaps the large preview. The showcase advances
 * on its own every few seconds, pausing while the pointer / focus is inside it or the visitor prefers
 * reduced motion.
 */
export function TopShowcase({ items }: { items: Product[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = items[Math.min(active, items.length - 1)];

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => setActive((i) => (i + 1) % items.length), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, items.length]);

  if (!current) return null;

  return (
    <div
      className="showcase"
      aria-label="Top projects"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setPaused(false)}
    >
      <div className="showcase__main" key={current.id}>
        <ProductCard product={current} large />
      </div>

      <div className="showcase__thumbs" role="tablist" aria-label="Choose a top project">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={p.title}
            className={`showcase__thumb ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            <VideoPreview product={p} playing={false} sound={false} />
          </button>
        ))}
      </div>
    </div>
  );
}
