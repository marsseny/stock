import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { countByCategory } from '../data/products';
import { useCart } from '../store/cart';
import { ArrowRight, Bag, Chevron, Close, Menu, Search } from './Icons';

type NavKey = 'shop' | 'packs' | 'plugins' | 'about';

function useActiveNav(): NavKey | null {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/browse')) {
    if (params.get('type') === 'pack') return 'packs';
    if (params.get('cat') === 'plugins') return 'plugins';
  }
  return 'shop';
}

const TYPES = [
  { label: 'Featured', to: '/browse?type=featured' },
  { label: 'Big packs', to: '/browse?type=pack' },
  { label: 'Single projects', to: '/browse?type=basic' },
  { label: 'New arrivals', to: '/browse?sort=newest' },
];

function ShopMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="menu glass-panel" role="menu">
      <div className="menu__col">
        <div className="menu__heading">By application</div>
        {CATEGORIES.map((c) => (
          <Link key={c.id} to={`/browse?cat=${c.id}`} className="menu__item" role="menuitem" onClick={onNavigate}>
            <span>{c.label}</span>
            <small>{countByCategory(c.id)}</small>
            <span className="menu__arrow">
              <ArrowRight width={16} height={16} />
            </span>
          </Link>
        ))}
      </div>
      <div className="menu__col">
        <div className="menu__heading">By type</div>
        {TYPES.map((t) => (
          <Link key={t.to} to={t.to} className="menu__item" role="menuitem" onClick={onNavigate}>
            <span>{t.label}</span>
            <span className="menu__arrow">
              <ArrowRight width={16} height={16} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const active = useActiveNav();
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const closeTimer = useRef<number>(undefined);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Small delay so the pointer can travel from the trigger into the panel.
  const openMenu = () => {
    window.clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), 140);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
  };

  const pill = (key: NavKey) => `nav__link ${active === key ? 'is-active' : ''}`;

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header__inner">
        <Link to="/" className="logo" aria-label="Framehaus home">
          <span className="logo__mark" />
          Framehaus
        </Link>

        <nav className="nav glass-pill" aria-label="Main">
          <div className="nav__dropdown" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            <button
              className={pill('shop')}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              Shop <Chevron width={14} height={14} className={`chev ${menuOpen ? 'is-open' : ''}`} />
            </button>
            {menuOpen && <ShopMenu onNavigate={() => setMenuOpen(false)} />}
          </div>
          <NavLink to="/browse?type=pack" className={pill('packs')}>
            Packs
          </NavLink>
          <NavLink to="/browse?cat=plugins" className={pill('plugins')}>
            Plugins
          </NavLink>
          <NavLink to="/about" className={pill('about')}>
            About
          </NavLink>
        </nav>

        <div className="header__actions">
          <form className="search glass-pill" onSubmit={submit} role="search">
            <Search width={16} height={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" aria-label="Search" />
          </form>
          <button className="btn btn--glass btn--icon" onClick={cart.open} aria-label={`Cart (${cart.items.length})`}>
            <Bag />
            {cart.items.length > 0 && <span className="count">{cart.items.length}</span>}
          </button>
          <button className="btn btn--glass btn--sm hide-sm">Sign in</button>
          <button className="btn btn--glass btn--icon show-sm" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <Close /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu glass-panel">
          <form className="search glass-pill" onSubmit={submit} role="search">
            <Search width={16} height={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" aria-label="Search" />
          </form>
          <div className="menu__heading">Shop</div>
          {[...CATEGORIES.map((c) => ({ label: c.label, to: `/browse?cat=${c.id}` })), ...TYPES, { label: 'About', to: '/about' }].map(
            (l) => (
              <Link key={l.to} to={l.to} className="menu__item">
                <span>{l.label}</span>
                <span className="menu__arrow">
                  <ArrowRight width={16} height={16} />
                </span>
              </Link>
            ),
          )}
        </div>
      )}
    </header>
  );
}
