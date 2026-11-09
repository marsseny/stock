import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Catalog } from '../components/Catalog';
import { ArrowRight, Search } from '../components/Icons';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../data/categories';
import { FEATURED, PRODUCTS } from '../data/products';

const HOME_FEATURED = 6;

export function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const packs = PRODUCTS.filter((p) => p.tier === 'pack').length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <section className="hero">
        <p className="eyebrow">After Effects · Premiere Pro · Plugins · Packs</p>
        <h1>
          Templates that make
          <br />
          your edit <em>move.</em>
        </h1>
        <p className="hero__lead muted">
          {PRODUCTS.length} hand-picked projects, {packs} big packs and pro tools from independent motion designers. Buy once, use
          forever.
        </p>

        <form className="hero__search glass-pill" onSubmit={submit} role="search">
          <Search width={20} height={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, transitions, LUTs…" aria-label="Search" />
          <button className="btn btn--glass">Search</button>
        </form>

        <div className="hero__cats">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/browse?cat=${c.id}`} className="chip">
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div>
            <h2>Featured</h2>
            <p className="muted">Staff picks this week — hover to preview.</p>
          </div>
          <Link to="/browse?type=featured" className="btn btn--glass btn--sm">
            View all <ArrowRight width={16} height={16} />
          </Link>
        </div>
        <div className="grid">
          {FEATURED.slice(0, HOME_FEATURED).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div>
            <h2>Explore all</h2>
            <p className="muted">Single projects and big packs for every kind of edit.</p>
          </div>
        </div>
        <Catalog exclude="featured" />
      </section>
    </>
  );
}
