import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { initialLinkError, loadSupabase } from '../lib/supabase';

const RESEND_COOLDOWN = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
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
