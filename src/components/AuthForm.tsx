import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { initialLinkError, loadSupabase } from '../lib/supabase';

const RESEND_COOLDOWN = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** sessionStorage key: `slug|PROMO` of the checkout that re-opens after the Google redirect. */
export const PENDING_CHECKOUT_KEY = 'fh_pending_checkout';

interface Props {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
}

export function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/**
 * Passwordless sign-in by magic link: the buyer types an e-mail, Supabase sends a sign-in link that
 * returns to /account (`detectSessionInUrl` picks the session up; the parent listens to `onAuthStateChange`).
 * Supabase → Auth → URL Configuration must allow `<site>/account` as a redirect URL.
 */
export function AuthForm({
  eyebrow = 'My Account',
  title = 'Sign in to your account',
  intro = 'Enter the e-mail you used at checkout — we’ll send you a sign-in link. No password needed.',
}: Props) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialLinkError);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const clean = (sentTo || email).trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError('Enter a valid e-mail address.');
      return;
    }
    setBusy(true);
    setError('');
    const supabase = await loadSupabase();
    if (!supabase) {
      setBusy(false);
      setError('Sign-in is not available right now. Please try again later.');
      return;
    }
    const { error: err } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/account` },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSentTo(clean);
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <div className="auth glass-panel">
      <span className="modal__eyebrow">{eyebrow}</span>
      {!sentTo ? (
        <>
          <h1>{title}</h1>
          <p className="muted">{intro}</p>
          <form className="auth__form" onSubmit={send} noValidate>
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
                autoFocus
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn--accent btn--lg btn--block" disabled={busy}>
              {busy ? <span className="spinner" /> : null}
              {busy ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1>Check your inbox</h1>
          <p className="muted">
            We sent a sign-in link to <strong>{sentTo}</strong>. Open it on this device to see your files.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="auth__links">
            <button type="button" className="link-btn" onClick={() => void send()} disabled={busy || cooldown > 0}>
              {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setSentTo('');
                setError('');
              }}
            >
              Use another e-mail
            </button>
          </div>
        </>
      )}
    </div>
  );
}
