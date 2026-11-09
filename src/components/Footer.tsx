import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div>
          <Link to="/" className="logo">
            <span className="logo__mark" />
            Framehaus
          </Link>
          <p className="muted">Premium templates, plugins and packs for video creators.</p>
        </div>
        <div className="footer__col">
          <h4>Shop</h4>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/browse?cat=${c.id}`}>
              {c.label}
            </Link>
          ))}
        </div>
        <div className="footer__col">
          <h4>Collections</h4>
          <Link to="/browse?type=featured">Featured</Link>
          <Link to="/browse?type=pack">Big packs</Link>
          <Link to="/browse?sort=newest">New arrivals</Link>
        </div>
        <div className="footer__col">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/about#license">License</Link>
          <Link to="/about#sell">Become an author</Link>
        </div>
      </div>
      <div className="footer__bottom muted">© {new Date().getFullYear()} Framehaus. All rights reserved.</div>
    </footer>
  );
}
