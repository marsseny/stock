import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

const RESEND_COOLDOWN = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** sessionStorage key: `slug|PROMO` of the checkout that re-opens after the Google redirect. */
export const PENDING_CHECKOUT_KEY = 'fh_pending_checkout';

interface Props {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  /** `modal` — compact layout inside the checkout modal. */
  variant?: 'page' | 'modal';
  /** `slug|PROMO` of the checkout to re-open after "Continue with Google" returns. */
  pendingCheckout?: string;
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
 * Passwordless sign-in: "Continue with Google" or e-mail → 6-digit code (Supabase OTP).
 * The first sign-in creates the buyer account. Success is picked up by `onAuthStateChange` in the parent.
 */
export function AuthForm({
  eyebrow = 'My Purchases',
  title = 'Sign in to your downloads',
  intro = 'Enter the e-mail you used at checkout. We’ll send you a 6-digit code — no password needed.',
  variant = 'page',
  pendingCheckout,
}: Props) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const google = async () => {
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
      if (pendingCheckout) sessionStorage.setItem(PENDING_CHECKOUT_KEY, pendingCheckout);
    } catch {
      /* storage unavailable — the buyer just clicks Buy now again after returning */
    }
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('#')[0] },
    });
    if (err) {
      setBusy(false);
      setError(err.message);
    }
    // On success the browser navigates to Google.
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!supabase) return;
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError('Enter a valid e-mail address.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail(clean);
    setCode('');
    setStep('code');
    setCooldown(RESEND_COOLDOWN);
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the e-mail.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setBusy(false);
    if (err) setError(err.message.includes('expired') || err.message.includes('invalid') ? 'This code is invalid or has expired.' : err.message);
  };

  const Heading = variant === 'modal' ? 'h3' : 'h1';

  return (
    <div className={variant === 'modal' ? 'auth auth--modal' : 'auth glass-panel'}>
      {variant === 'page' && <span className="modal__eyebrow">{eyebrow}</span>}
      {step === 'email' ? (
        <>
          <Heading>{title}</Heading>
          <p className="muted">{intro}</p>
          <button type="button" className="btn btn--google btn--lg btn--block" onClick={google} disabled={busy}>
            <GoogleLogo /> Continue with Google
          </button>
          <div className="auth__or" aria-hidden>
            <span>or use e-mail</span>
          </div>
          <form className="auth__form" onSubmit={sendCode}>
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
                autoFocus={variant === 'page'}
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn--accent btn--lg btn--block" disabled={busy}>
              {busy ? <span className="spinner" /> : null}
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        </>
      ) : (
        <>
          <Heading>Check your inbox</Heading>
          <p className="muted">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>
          <form className="auth__form" onSubmit={verify}>
            <label className="field">
              <span>6-digit code</span>
              <input
                ref={codeRef}
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="••••••"
                required
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn--accent btn--lg btn--block" disabled={busy || code.length !== 6}>
              {busy ? <span className="spinner" /> : null}
              {busy ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>
          <div className="auth__links">
            <button type="button" className="link-btn" onClick={() => void sendCode()} disabled={busy || cooldown > 0}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStep('email');
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
