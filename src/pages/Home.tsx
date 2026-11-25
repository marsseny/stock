import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Catalog } from '../components/Catalog';
import { Search } from '../components/Icons';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../data/categories';
import { ALL_TAGS, FEATURED } from '../data/products';

/** Top projects shown large in the left half of the first screen. */
const HERO_TOP = 2;
const HERO_TAGS = 8;

const TOP = FEATURED.slice(0, HERO_TOP);
const TOP_IDS = TOP.map((p) => p.id);

export function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <section className="hero-split">
        <div className="hero-split__top" aria-label="Top projects">
          {TOP.map((p) => (
            <ProductCard key={p.id} product={p} large />
          ))}
        </div>

        <div className="hero-split__panel">
          <picture className="hero-split__art" aria-hidden>
            <source media="(max-width: 900px)" srcSet="/media/art/hero-dunes-900.webp" />
            <img src="/media/art/hero-dunes.webp" alt="" fetchPriority="high" />
          </picture>
          <div className="hero-split__content">
            <p className="eyebrow">After Effects · Premiere Pro · Plugins · Packs</p>
            <h1>Premium Video Templates</h1>
            <p className="hero__lead">Hand-picked by independent motion designers. Buy once, use forever.</p>

            <form className="hero__search" onSubmit={submit} role="search">
              <Search width={20} height={20} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, transitions, LUTs…" aria-label="Search" />
              <button className="btn btn--accent">Search</button>
            </form>

            <div className="hero__cats">
              {CATEGORIES.map((c) => (
                <Link key={c.id} to={`/browse?cat=${c.id}`} className="chip">
                  {c.label}
                </Link>
              ))}
            </div>

            <div className="hero__tags">
              <span>Popular</span>
              {ALL_TAGS.slice(0, HERO_TAGS).map((t) => (
                <Link key={t} to={`/browse?tag=${encodeURIComponent(t)}`}>
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>All projects</h2>
        </div>
        <Catalog hideIds={TOP_IDS} showTags={false} />
      </section>
    </>
  );
}
