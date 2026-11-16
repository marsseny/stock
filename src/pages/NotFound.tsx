import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <section className="section section--page center-block">
      <h1>Not found</h1>
      <p className="muted">This page doesn’t exist or the item was removed.</p>
      <Link to="/" className="btn btn--glass btn--lg">
        Back to the shop
      </Link>
    </section>
  );
}
