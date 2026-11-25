import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Close, Menu, Search, User } from './Icons';
import { Logo } from './Logo';

/** Main menu: applications + About. No project counts anywhere in the menu. */
const NAV = [
  { key: 'after-effects', label: 'After Effects', to: '/browse?cat=after-effects' },
  { key: 'premiere-pro', label: 'Premiere Pro', to: '/browse?cat=premiere-pro' },
  { key: 'plugins', label: 'Plugins', to: '/browse?cat=plugins' },
  { key: 'presets', label: 'LUTs', to: '/browse?cat=presets' },
  { key: 'sound-fx', label: 'Sound FX', to: '/browse?cat=sound-fx' },
  { key: 'about', label: 'About', to: '/about' },
] as const;

function useActiveNav(): string | null {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/account')) return 'account';
  if (pathname.startsWith('/browse')) return params.get('cat');
  return null;
}

export function Header() {
  const active = useActiveNav();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => setMobileOpen(false), [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header__inner">
        <Link to="/" className="logo" aria-label="Nuova Motion home">
          <Logo />
        </Link>

        <nav className="nav glass-pill" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.key}
              to={n.to}
              className={`nav__link ${active === n.key ? 'is-active' : ''}`}
              aria-current={active === n.key ? 'page' : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="header__actions">
          <form className="search glass-pill" onSubmit={submit} role="search">
            <Search width={16} height={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" aria-label="Search" />
          </form>
          <Link
            to="/account"
            className={`btn btn--glass btn--sm purchases-btn ${active === 'account' ? 'is-done' : ''}`}
            aria-label="My Account"
          >
            <User width={16} height={16} />
            <span className="hide-sm">My Account</span>
          </Link>
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
          {[...NAV, { key: 'account', label: 'My Account', to: '/account' }].map((l) => (
            <Link key={l.key} to={l.to} className={`menu__item ${active === l.key ? 'is-active' : ''}`}>
              <span>{l.label}</span>
              <span className="menu__arrow">
                <ArrowRight width={16} height={16} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
