import { Link } from 'react-router-dom';

export function About() {
  return (
    <section className="section section--page prose">
      <h1>About Framehaus</h1>
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
          <h3>Sell your work</h3>
          <p className="muted">Authors keep 70% of every sale. Packs and featured placements get extra exposure.</p>
        </div>
      </div>

      <Link to="/" className="btn btn--glass btn--lg">
        Explore templates
      </Link>
    </section>
  );
}
