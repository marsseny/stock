import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getDetails } from '../data/details';
import type { Feature, Product, SceneGroup } from '../types';
import { ChevronLeft, ChevronRight, FEATURE_ICONS } from './Icons';

/**
 * Detailed project description on the product page, in strict dark blocks with thin rims (v22):
 * an intro card, numbered feature cards ("01 Feature" + a small grey tag, a monochrome line icon or a
 * small animation with no frame, a two-weight title and the text) and compact perk cards for minor features, then the
 * screens from the project grouped by category, and small tags.
 * Content comes from `getDetails` — editable per project in `src/data/details/<slug>.json`.
 */
export function ProjectDetails({ product }: { product: Product }) {
  const d = getDetails(product);
  const kind = product.tier === 'pack' ? 'pack' : 'project';
  const cards = d.features.filter((f) => f.size !== 'sm');
  const perks = d.features.filter((f) => f.size === 'sm');

  return (
    <section className="details" aria-label={`About this ${kind}`}>
      <article className="feat-intro">
        <span className="feat-intro__eyebrow">About this {kind}</span>
        <p>{d.summary}</p>
      </article>

      {cards.length > 0 && (
        <div className="feat-grid">
          {cards.map((f, i) => (
            <FeatureCard key={f.key} f={f} n={i + 1} />
          ))}
        </div>
      )}

      {perks.length > 0 && (
        <div className="feat-perks">
          {perks.map((f, i) => (
            <Perk key={f.key} f={f} index={cards.length + i} />
          ))}
        </div>
      )}

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

/** Picks a themed icon for features without one (e.g. custom `extra` features from the JSON file). */
const ICON_GUESSES: [RegExp, string][] = [
  [/phone|mockup|device|screen/, 'phone'],
  [/\b3d\b|cube|render/, 'cube'],
  [/colou?r|grad(e|ing)|\blut/, 'palette'],
  [/sound|music|audio|sfx/, 'music'],
  [/font|text|title|typo/, 'font'],
  [/fast|quick|speed|one[- ]click|instant/, 'bolt'],
  [/4k|resolution|\bhd\b|display/, 'monitor'],
  [/transition|layer|scene|pack/, 'layers'],
];
function iconFor(f: Feature) {
  if (f.icon && FEATURE_ICONS[f.icon]) return FEATURE_ICONS[f.icon];
  const hay = `${f.title} ${f.text ?? ''}`.toLowerCase();
  const hit = ICON_GUESSES.find(([re]) => re.test(hay));
  return FEATURE_ICONS[hit ? hit[1] : 'sparkle'];
}

/** First word strong, the rest in a lighter, softer weight (like "Smart Transcription"). */
function TwoWeight({ text, strong }: { text: string; strong?: string }) {
  if (strong)
    return (
      <>
        <b>{strong}</b> <span>{text}</span>
      </>
    );
  const t = text.charAt(0).toUpperCase() + text.slice(1);
  const i = t.indexOf(' ');
  if (i < 0) return <b>{t}</b>;
  return (
    <>
      <b>{t.slice(0, i)}</b> <span>{t.slice(i + 1)}</span>
    </>
  );
}

function FeatureCard({ f, n }: { f: Feature; n: number }) {
  const Icon = iconFor(f);
  const tag = f.tag ?? (f.key.startsWith('extra-') ? 'Highlight' : undefined);
  const cls = ['fcard', `tone--${f.tone ?? 'steel'}`, f.visual && `fcard--${f.visual}`].filter(Boolean).join(' ');

  let art: ReactNode;
  if (f.visual === 'stat') {
    art = (
      <div className="fvis fvis--stat">
        <Ruler />
        <strong>{f.value}</strong>
      </div>
    );
  } else if (f.visual === 'app') {
    art = (
      <div className="fvis fvis--app">
        <Icon width={38} height={38} />
        {f.value && <span className="fvis__version">{f.value}</span>}
      </div>
    );
  } else if (f.visual) {
    art = (
      <div className="fvis fvis--viz">
        <span className="fvis__chip">
          <Icon width={16} height={16} />
        </span>
        <Visual kind={f.visual} />
      </div>
    );
  } else {
    art = (
      <div className="fvis fvis--icon">
        <Icon width={40} height={40} />
      </div>
    );
  }

  return (
    <article className={cls} style={{ '--i': n } as CSSProperties}>
      <header className="fcard__head">
        <span className="fcard__num">
          {String(n).padStart(2, '0')}
          <sup>Feature</sup>
        </span>
        {tag && <span className="fcard__tag">{tag}</span>}
      </header>
      <div className="fcard__art">{art}</div>
      <div className="fcard__body">
        <h3>
          {f.visual === 'app' ? <TwoWeight strong={f.title} text="compatible" /> : <TwoWeight text={f.title} />}
        </h3>
        {f.text && <p>{f.text}</p>}
      </div>
    </article>
  );
}

/** Minor feature: compact dark card with an icon, a two-weight title and the full text (never truncated). */
function Perk({ f, index }: { f: Feature; index: number }) {
  const Icon = iconFor(f);
  return (
    <article className="perk" style={{ '--i': index } as CSSProperties}>
      <span className="perk__icon">
        <Icon width={20} height={20} />
      </span>
      <div>
        <h4>
          <TwoWeight text={f.title} />
        </h4>
        {f.text && <small>{f.text}</small>}
      </div>
    </article>
  );
}

/** Dial ticks above the big number of the stat card. */
function Ruler() {
  return (
    <div className="ruler" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} className={i % 7 === 0 ? 'is-major' : ''} />
      ))}
    </div>
  );
}

/** Small animated illustrations inside feature cards (CSS transforms only). */
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

/* ---------- Screens from the project: category tabs (big packs only) + 3-per-row scene previews, 1–8 rows ---------- */

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
        <h2>Screens from the project</h2>
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
