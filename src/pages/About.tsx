import { Link } from 'react-router-dom';

export function About() {
  return (
    <section className="section section--page prose">
      <h1>About Nuova Motion</h1>
      <p className="muted lead">
        A curated marketplace of templates, plugins and packs for After Effects, Premiere Pro, DaVinci Resolve and more —
        made by independent motion designers.
      </p>

      <div className="about-grid">
        <div className="glass-panel">
          <h3>Pay per project</h3>
          <p className="muted">No subscription. Every template has its own price, and you own it forever.</p>
        </div>
        <div className="glass-panel" id="license">
          <h3>One simple license</h3>
          <p className="muted">Use in unlimited personal and commercial projects. Reselling the source files is not allowed.</p>
        </div>
        <div className="glass-panel" id="sell">
          <h3>Our authors</h3>
          <p className="muted">
            Our core team of designers is complete and we are not recruiting right now — but you can still{' '}
            <Link to="/become-author">apply to become an author</Link>.
          </p>
        </div>
      </div>

      <Link to="/" className="btn btn--glass btn--lg">
        Explore templates
      </Link>
    </section>
  );
}
