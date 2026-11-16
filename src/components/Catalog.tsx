import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, isCategoryId } from '../data/categories';
import { ALL_TAGS, queryProducts, type SortKey, type TierFilter } from '../data/products';
import type { Tier } from '../types';
import { Close } from './Icons';
import { ProductCard } from './ProductCard';

const PAGE = 20;

const TIERS: { id: TierFilter; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'featured', label: 'Featured' },
  { id: 'pack', label: 'Packs' },
  { id: 'basic', label: 'Single' },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'popular', label: 'Most popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
];

interface Props {
  /** Tier hidden while the type filter is "all" (home page shows featured separately above). */
  exclude?: Tier;
  /** Element id to scroll to when filters change. */
  anchorId?: string;
}

/** Filterable product grid. All filter state lives in the URL so views are shareable. */
export function Catalog({ exclude, anchorId = 'catalog' }: Props) {
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);

  const cat = params.get('cat');
  const category = isCategoryId(cat) ? cat : null;
  const tierParam = params.get('type') as TierFilter | null;
  const tier: TierFilter = TIERS.some((t) => t.id === tierParam) ? tierParam! : 'all';
  const tags = params.getAll('tag');
  const q = params.get('q') ?? '';
  const sortParam = params.get('sort') as SortKey | null;
  const sort: SortKey = SORTS.some((s) => s.id === sortParam) ? sortParam! : 'popular';

  const tagsKey = tags.join('|');
  const results = useMemo(() => {
    const list = queryProducts({ category, tier, tags: tagsKey ? tagsKey.split('|') : [], q, sort });
    return tier === 'all' && exclude ? list.filter((p) => p.tier !== exclude) : list;
  }, [category, tier, tagsKey, q, sort, exclude]);

  useEffect(() => setLimit(PAGE), [params]);

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const setOrDelete = (key: string, value: string | null) =>
    update((p) => (value ? p.set(key, value) : p.delete(key)));

  const toggleTag = (t: string) =>
    update((p) => {
      const cur = p.getAll('tag');
      p.delete('tag');
      (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]).forEach((x) => p.append('tag', x));
    });

  const hasFilters = !!(category || tier !== 'all' || tags.length || q);

  return (
    <section className="catalog" id={anchorId}>
      <div className="toolbar">
        <div className="seg glass-pill" role="tablist" aria-label="Application">
          <button className={`seg__item ${!category ? 'is-active' : ''}`} onClick={() => setOrDelete('cat', null)}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`seg__item ${category === c.id ? 'is-active' : ''}`}
              onClick={() => setOrDelete('cat', c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="toolbar__row">
          <div className="seg seg--sm glass-pill" aria-label="Type">
            {TIERS.map((t) => (
              <button
                key={t.id}
                className={`seg__item ${tier === t.id ? 'is-active' : ''}`}
                onClick={() => setOrDelete('type', t.id === 'all' ? null : t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="select glass-pill">
            <span className="muted">Sort</span>
            <select value={sort} onChange={(e) => setOrDelete('sort', e.target.value === 'popular' ? null : e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="chips">
          {ALL_TAGS.slice(0, 18).map((t) => (
            <button key={t} className={`chip ${tags.includes(t) ? 'is-active' : ''}`} onClick={() => toggleTag(t)}>
              {t}
            </button>
          ))}
          {tags
            .filter((t) => !ALL_TAGS.slice(0, 18).includes(t))
            .map((t) => (
              <button key={t} className="chip is-active" onClick={() => toggleTag(t)}>
                {t}
              </button>
            ))}
        </div>

        <div className="toolbar__summary">
          <span className="muted">
            {results.length} {results.length === 1 ? 'result' : 'results'}
            {q && (
              <>
                {' '}
                for “<b>{q}</b>”
              </>
            )}
          </span>
          {hasFilters && (
            <button className="link-btn" onClick={() => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true })}>
              <Close width={14} height={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty glass-panel">
          <h3>Nothing found</h3>
          <p className="muted">Try removing a filter or searching for something else.</p>
        </div>
      ) : (
        <div className="grid">
          {results.slice(0, limit).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {results.length > limit && (
        <div className="center">
          <button className="btn btn--glass btn--lg" onClick={() => setLimit((l) => l + PAGE)}>
            Load more · {results.length - limit} left
          </button>
        </div>
      )}
    </section>
  );
}
