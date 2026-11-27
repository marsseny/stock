import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Catalog } from '../components/Catalog';
import { Search } from '../components/Icons';
import { TopShowcase } from '../components/TopShowcase';
import { CATEGORIES } from '../data/categories';
import { ALL_TAGS, FEATURED, PRODUCTS } from '../data/products';

/** Top projects in the right half of the first screen: one large preview + 2 rows of 3 small banners. */
const HERO_TOP = 6;
const HERO_TAGS = 8;
/** "All projects" shows 1.5× the regular page at first: 27 cards = 9 full rows of 3. */
const HOME_PAGE = 27;

// Featured items first; topped up with other projects if there are fewer than HERO_TOP of them.
const TOP = [...FEATURED, ...PRODUCTS.filter((p) => p.tier !== 'featured')].slice(0, HERO_TOP);

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
        <div className="hero-split__panel">
          <picture className="hero-split__art" aria-hidden>
            <source media="(max-width: 900px)" srcSet="/media/art/hero-dunes-900.webp" />
            <img src="/media/art/hero-dunes.webp" alt="" fetchPriority="high" />
          </picture>
          <div className="hero-split__content">
            <p className="eyebrow">After Effects · Premiere Pro · Plugins · Packs</p>
            <h1 className="hero-title">
              Premium
              <br />
              <span>Video Templates</span>
            </h1>
            <p className="hero__lead">
              Hand-picked by independent motion designers.
              <br />
              Buy once, use forever.
            </p>

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

        <TopShowcase items={TOP} />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>All projects</h2>
        </div>
        <Catalog showTags={false} pageSize={HOME_PAGE} />
      </section>
    </>
  );
}
