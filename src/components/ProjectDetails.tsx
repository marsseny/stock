import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { getDetails } from '../data/details';
import type { Feature, Product, SceneGroup } from '../types';
import { ChevronLeft, ChevronRight, FEATURE_ICONS } from './Icons';

/**
 * Detailed project description on the product page: a bento grid of feature tiles
 * (big tiles with icons for key features, small text pills for minor ones), a carousel
 * of included scenes grouped by category, and small tags.
 * Content comes from `getDetails` — editable per project in `src/data/details/<slug>.json`.
 */
export function ProjectDetails({ product }: { product: Product }) {
  const d = getDetails(product);
  const kind = product.tier === 'pack' ? 'pack' : 'project';

  return (
    <section className="details" aria-label={`About this ${kind}`}>
      <div className={`bento ${d.features.length ? '' : 'bento--solo'}`}>
        <article className="tile tile--lg tile--summary">
          <span className="tile__eyebrow">About this {kind}</span>
          <p>{d.summary}</p>
        </article>
        {d.features.map((f, i) => (
          <FeatureTile key={f.key} f={f} index={i} />
        ))}
      </div>

      {d.included.length > 0 && <Included groups={d.included} hue={product.preview.hueA} />}

      {d.tags.length > 0 && (
        <div className="details__tags">
          <span>Tags</span>
          {d.tags.map((t) => (
            <Link key={t} to={`/browse?tag=${encodeURIComponent(t)}`}>
              #{t}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function FeatureTile({ f, index }: { f: Feature; index: number }) {
  const Icon = f.icon ? FEATURE_ICONS[f.icon] : undefined;
  const cls = [
    'tile',
    `tile--${f.visual === 'stat' ? 'stat' : f.size}`,
    f.tone && `tone--${f.tone}`,
    f.visual && `tile--${f.visual}`,
  ]
    .filter(Boolean)
    .join(' ');
  const style = { '--i': index } as CSSProperties;

  if (f.visual === 'stat') {
    return (
      <article className={cls} style={style}>
        <Ruler />
        <strong className="tile__stat">{f.value}</strong>
        <span className="tile__label">{f.title}</span>
        {f.text && <p>{f.text}</p>}
      </article>
    );
  }

  if (f.size === 'sm') {
    return (
      <article className={cls} style={style} title={f.text ? `${f.title} — ${f.text}` : f.title}>
        {Icon && <Icon width={16} height={16} className="tile__mini-icon" />}
        <div>
          <h4>{f.title}</h4>
          {f.text && <small>{f.text}</small>}
        </div>
      </article>
    );
  }

  return (
    <article className={cls} style={style}>
      <div className="tile__top">
        {Icon && (
          <span className="tile__icon">
            <Icon width={f.visual === 'app' ? 30 : 22} height={f.visual === 'app' ? 30 : 22} />
          </span>
        )}
        {f.visual === 'app' && f.value && <span className="tile__version">{f.value}</span>}
      </div>
      {f.visual && f.visual !== 'app' && <Visual kind={f.visual} />}
      <div className="tile__body">
        <h3>{f.visual === 'app' ? `Works with ${f.title}` : f.title}</h3>
        {f.text && <p>{f.text}</p>}
      </div>
    </article>
  );
}

/** Dial ticks at the top of the stat tile. */
function Ruler() {
  return (
    <div className="ruler" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} className={i % 7 === 0 ? 'is-major' : ''} />
      ))}
    </div>
  );
}

/** Small animated illustrations inside tiles (CSS transforms only). */
function Visual({ kind }: { kind: NonNullable<Feature['visual']> }) {
  if (kind === 'timeline')
    return (
      <div className="viz viz--timeline" aria-hidden>
        <div className="viz__ticks">
          {Array.from({ length: 24 }, (_, i) => <i key={i} />)}
        </div>
        <div className="viz__track">
          <span className="viz__clip">
            <span className="viz__handle" />
          </span>
        </div>
        <div className="viz__track viz__track--dim">
          <span className="viz__clip viz__clip--b" />
        </div>
      </div>
    );
  if (kind === 'resize')
    return (
      <div className="viz viz--resize" aria-hidden>
        <span className="viz__frame" />
      </div>
    );
  if (kind === 'sliders')
    return (
      <div className="viz viz--sliders" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="viz__slider" style={{ '--n': i } as CSSProperties}>
            <i />
          </span>
        ))}
      </div>
    );
  if (kind === 'textbox')
    return (
      <div className="viz viz--textbox" aria-hidden>
        <span className="viz__box" />
        <span className="viz__text">Your title here</span>
      </div>
    );
  return null;
}

/* ---------- What's included: category tabs (big packs only) + 3-per-row scene previews, 1–8 rows ---------- */

/** Scenes visible per row (wider screens). */
const PER_ROW_VISIBLE = 3;
/** Up to 8 rows; with more than 24 scenes each row scrolls horizontally. */
const MAX_ROWS = 8;
const MAX_THUMBS = 60;

function Included({ groups, hue }: { groups: SceneGroup[]; hue: number }) {
  const [active, setActive] = useState(0);
  const group = groups[Math.min(active, groups.length - 1)];

  const thumbs: (string | null)[] = group.images.length
    ? group.images.slice(0, MAX_THUMBS)
    : Array.from({ length: Math.min(group.count, MAX_THUMBS) }, () => null);
  const rowsCount = Math.max(1, Math.min(MAX_ROWS, Math.ceil(thumbs.length / PER_ROW_VISIBLE)));
  const perRow = Math.ceil(thumbs.length / rowsCount);
  const rows = Array.from({ length: rowsCount }, (_, r) => thumbs.slice(r * perRow, (r + 1) * perRow));

  return (
    <div className="included">
      <div className="included__head">
        <h2>What’s included</h2>
      </div>

      {groups.length > 1 && (
        <div className="included__tabs" role="tablist" aria-label="Scene categories">
          {groups.map((g, i) => (
            <button
              key={g.title}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`cat-tab ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              {g.title}
              <span className="cat-tab__count">{g.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="included__rows" key={active} role="tabpanel" aria-label={`${group.title} — ${group.count} scenes`}>
        {rows.map((row, r) => (
          <SceneRow key={r} items={row} offset={r * perRow} hue={hue + active * 37} label={group.title} />
        ))}
      </div>
    </div>
  );
}

function SceneRow({ items, offset, hue, label }: { items: (string | null)[]; offset: number; hue: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: items.length <= PER_ROW_VISIBLE });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(update, [items.length]);

  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className="scene-row">
      <button type="button" className="scene-row__nav scene-row__nav--prev" onClick={() => scroll(-1)} disabled={edge.start} aria-label="Scroll left">
        <ChevronLeft width={18} height={18} />
      </button>
      <div className="scene-row__track" ref={ref} onScroll={update}>
        {items.map((src, i) => {
          const n = offset + i + 1;
          return (
            <figure key={n} className="scene" style={{ '--h': (hue + n * 23) % 360 } as CSSProperties}>
              {src ? (
                <img src={src} alt={`${label} — scene ${n}`} loading="lazy" decoding="async" />
              ) : (
                <div className="scene__ph" aria-hidden>
                  <span />
                </div>
              )}
            </figure>
          );
        })}
      </div>
      <button type="button" className="scene-row__nav scene-row__nav--next" onClick={() => scroll(1)} disabled={edge.end} aria-label="Scroll right">
        <ChevronRight width={18} height={18} />
      </button>
    </div>
  );
}
