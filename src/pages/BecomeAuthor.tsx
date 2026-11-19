import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check } from '../components/Icons';
import { CONTACT_MAX_LENGTH, sendContact } from '../lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

/**
 * /become-author — the core author team is complete; visitors can still leave an application
 * (e-mail + portfolio link + a few words). Sent through /api/contact with `topic: 'author'`.
 */
export function BecomeAuthor() {
  const [email, setEmail] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = 'Become an author — Nuova Motion';
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPortfolio = portfolio.trim();
    if (!EMAIL_RE.test(cleanEmail)) return setError('Enter a valid e-mail so we can reach you.');
    if (cleanPortfolio && !URL_RE.test(cleanPortfolio)) return setError('The portfolio link should start with https://');
    if (!message.trim()) return setError('Tell us a little about yourself and your work.');
    setBusy(true);
    setError('');
    try {
      await sendContact({ topic: 'author', email: cleanEmail, portfolio: cleanPortfolio || undefined, message: message.trim(), website });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your application. Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section section--page prose author-page">
      <h1>Become an author</h1>
      <p className="muted lead">
        Nuova Motion is a small, curated collection made by a close-knit team of motion designers.
      </p>

      <div className="author-page__grid">
        <div className="glass-panel author-page__info">
          <span className="author-page__status">
            <span className="author-page__dot" aria-hidden /> Not recruiting right now
          </span>
          <h3>Our core team is complete</h3>
          <p className="muted">
            The core team of designers behind Nuova Motion has been formed, and we are not taking on new authors at the moment.
          </p>
          <p className="muted">
            You can still leave an application. We review every one of them — if we are impressed by your work, we will contact
            you by e-mail.
          </p>
          <ul className="author-page__tips muted">
            <li>Share a link to your best work (Behance, Dribbble, Vimeo, your site…)</li>
            <li>Tell us which apps you work in: After Effects, Premiere Pro, DaVinci Resolve…</li>
            <li>We only reply if we would like to work together</li>
          </ul>
        </div>

        <div className="glass-panel author-page__form-wrap">
          {sent ? (
            <div className="author-page__sent" role="status">
              <span className="delivery__check">
                <Check width={24} height={24} />
              </span>
              <h3>Application sent</h3>
              <p className="muted">
                Thank you! We have received your application. If we are impressed by your work, we will contact you at{' '}
                <strong>{email.trim().toLowerCase()}</strong>.
              </p>
              <Link to="/" className="btn btn--glass">
                Back to the store
              </Link>
            </div>
          ) : (
            <form className="author-page__form" onSubmit={submit} noValidate>
              <h3>Leave an application</h3>
              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@studio.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field">
                <span>Portfolio link (optional)</span>
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => {
                    setPortfolio(e.target.value);
                    setError('');
                  }}
                  placeholder="https://behance.net/yourname"
                  autoComplete="url"
                  maxLength={300}
                />
              </label>
              <input className="ask__hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden />
              <label className="field">
                <span>Your application</span>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value.slice(0, CONTACT_MAX_LENGTH));
                    setError('');
                  }}
                  placeholder="A few words about you, your experience and the kind of templates you make."
                  rows={6}
                  required
                />
              </label>
              <div className="author-page__actions">
                <small className="muted">
                  {message.length}/{CONTACT_MAX_LENGTH}
                </small>
                <button type="submit" className="btn btn--accent btn--lg" disabled={busy}>
                  {busy ? <span className="spinner" /> : null} Send application
                </button>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
