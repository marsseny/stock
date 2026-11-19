import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { CopyButton } from '../components/CopyButton';
import { RateProject } from '../components/RateProject';
import { Check, Download, Gift } from '../components/Icons';
import { VideoPreview } from '../components/VideoPreview';
import { ProductCard } from '../components/ProductCard';
import { getProduct, PRODUCTS } from '../data/products';
import {
  ApiError,
  claimDownload,
  CONTACT_MAX_LENGTH,
  fetchMyReviews,
  getDownloadUrl,
  sendContact,
  startDownload,
  type ApiReview,
  type ClaimDownloadResult,
} from '../lib/api';
import { promoForPurchases } from '../lib/promo';
import { fetchMyPurchases, isFreePurchase, loadSupabase, missingConfig, useSupabase, type Purchase } from '../lib/supabase';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ------------------------------------ Purchase card ------------------------------------ */

interface PurchaseCardProps {
  purchase: Purchase;
  session: Session;
  review?: ApiReview;
  onReviewSaved: (review: ApiReview) => void;
}

function PurchaseCard({ purchase, session, review, onReviewSaved }: PurchaseCardProps) {
  const product = getProduct(purchase.product_slug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = product?.title ?? purchase.product_slug;

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const supabase = await loadSupabase();
      if (!supabase) throw new Error('Sign-in is not available right now. Please try again later.');
      // Use a fresh token in case the stored one is about to expire.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? session.access_token;
      const res = await getDownloadUrl(purchase.id, token);
      startDownload(res.downloadUrl, res.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare the download.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="purchase glass-panel">
      <div className="purchase__thumb">
        {product ? (
          <Link to={`/item/${product.slug}`} aria-label={title}>
            <VideoPreview product={product} playing={false} sound={false} />
          </Link>
        ) : (
          <div className="purchase__thumb-ph" />
        )}
      </div>
      <div className="purchase__info">
        <div className="purchase__top">
          <div>
            {product ? (
              <Link to={`/item/${product.slug}`} className="purchase__title">
                {title}
              </Link>
            ) : (
              <span className="purchase__title">{title}</span>
            )}
            <small className="muted">
              {isFreePurchase(purchase) ? 'Purchased' : 'Purchased'} {formatDate(purchase.created_at)}
            </small>
          </div>
          <button type="button" className="btn btn--accent btn--sm" onClick={download} disabled={busy}>
            {busy ? <span className="spinner" /> : <Download width={16} height={16} />}
            {busy ? 'Preparing…' : 'Download ZIP'}
          </button>
        </div>
        <div className="license license--compact">
          <div>
            <span className="license__label">License key</span>
            <code className="license__key">{purchase.license_key}</code>
          </div>
          <CopyButton value={purchase.license_key} label="Copy" />
        </div>
        {/* Only paid purchases can be rated: free test files (100%-off code) are not real buyers. */}
        {!isFreePurchase(purchase) && <RateProject productSlug={purchase.product_slug} review={review} onSaved={onReviewSaved} />}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}

/* ------------------------------------ Signed-in screen ------------------------------------ */

/** "maya.rossi@x.com" → "Maya"; uses the profile name when there is one. */
function firstName(session: Session): string {
  const meta = (session.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const source = (meta.full_name ?? meta.name ?? session.user.email?.split('@')[0] ?? '').trim();
  const word = source.split(/[\s._-]+/).map((p) => p.replace(/\d+/g, '')).find(Boolean) ?? '';
  return word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '';
}

function Welcome({ session }: { session: Session; paidCount: number; total: number }) {
  const name = firstName(session);
  return (
    <div className="welcome glass-panel">
      <div>
        <p className="welcome__eyebrow">{name ? `Welcome, ${name}` : 'Welcome'}</p>
        <h2 className="welcome__slogan">
          Templates handle the <em>routine</em>, you make the <em>magic</em>.
        </h2>
        <p>We’re truly happy you’re with us. Your purchased files, license keys and reviews are all below.</p>
      </div>
    </div>
  );
}

function Purchases({ session }: { session: Session }) {
  const [items, setItems] = useState<Purchase[] | null>(null);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Record<string, ApiReview>>({});

  // The buyer's own reviews, keyed by product slug (failure here must not hide the purchases).
  useEffect(() => {
    let cancelled = false;
    fetchMyReviews(session.access_token)
      .then((list) => {
        if (!cancelled) setReviews(Object.fromEntries(list.map((r) => [r.productSlug, r])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [session.access_token]);

  const onReviewSaved = useCallback((review: ApiReview) => {
    setReviews((prev) => ({ ...prev, [review.productSlug]: review }));
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await fetchMyPurchases();
      // The loyalty code is only shown in the banner; it is never applied automatically — the buyer types it.
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your purchases.');
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, session.user.id]);

  const signOut = async () => {
    const supabase = await loadSupabase();
    await supabase?.auth.signOut();
  };

  const paidCount = items ? items.filter((p) => !isFreePurchase(p)).length : 0;
  const promo = items ? promoForPurchases(paidCount) : null;

  return (
    <div className="account">
      <div className="account__head">
        <div>
          <span className="modal__eyebrow">Nuova Motion customer</span>
          <h1>My Account</h1>
          <p className="muted">
            Signed in as <strong>{session.user.email}</strong>
          </p>
        </div>
        <button type="button" className="btn btn--glass btn--sm" onClick={() => void signOut()}>
          Log out
        </button>
      </div>

      {items !== null && <Welcome session={session} paidCount={paidCount} total={items.length} />}

      {promo && (
        <div className="offer offer--wide" role="note">
          <Gift width={26} height={26} className="offer__icon" />
          <p>
            {promo.percent === 15 ? (
              <>
                🎁 Your next deal: Get <strong>15% OFF</strong> your 2nd product with promo code{' '}
                <strong className="offer__code">{promo.code}</strong> — and <strong>20% OFF</strong> on your 3rd and all subsequent products!
              </>
            ) : (
              <>
                🎁 VIP Tier: Get <strong>20% OFF</strong> your 3rd and all future products with promo code{' '}
                <strong className="offer__code">{promo.code}</strong>!
              </>
            )}
          </p>
          <CopyButton value={promo.code} label={`Copy ${promo.code}`} />
        </div>
      )}

      {error && (
        <div className="notice glass-panel" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn--glass btn--sm" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {items === null ? (
        <div className="account__loading">
          <span className="spinner spinner--lg" />
        </div>
      ) : items.length === 0 && !error ? (
        <div className="notice glass-panel">
          <h2>No purchases yet</h2>
          <p className="muted">Templates you buy with {session.user.email} will appear here with their license keys.</p>
          <Link to="/browse" className="btn btn--accent">
            Browse templates
          </Link>
        </div>
      ) : (
        <div className="purchases">
          <h2 className="purchases__title">Your purchases</h2>
          {items.map((p) => (
            <PurchaseCard
              key={p.id}
              purchase={p}
              session={session}
              review={reviews[p.product_slug]}
              onReviewSaved={onReviewSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Return from an off-site payment ------------------------------- */

const LAST_EMAIL_KEY = 'fh_checkout_email';
const RETRYABLE = new Set(['payment_not_completed', 'receipt_not_found', 'network_error', 'internal_error']);

/**
 * Whop sends the buyer back to `/account?product=<slug>&payment=pay_…&status=…` after 3-D Secure / bank pages.
 * A succeeded payment is claimed here exactly like in the checkout modal (works without signing in:
 * the e-mail typed at checkout is remembered in localStorage).
 */
function PaymentReturn({ session }: { session: Session | null }) {
  const [params, setParams] = useSearchParams();
  const paymentId = params.get('payment') ?? '';
  const status = params.get('status') ?? '';
  const slug = params.get('product') ?? '';
  const product = slug ? getProduct(slug) : undefined;
  const [state, setState] = useState<'idle' | 'busy' | 'ready' | 'error'>('idle');
  const [result, setResult] = useState<ClaimDownloadResult | null>(null);
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current || status !== 'succeeded' || !paymentId || !product?.whopPlanId) return;
    started.current = true;
    let email = '';
    try {
      email = localStorage.getItem(LAST_EMAIL_KEY) ?? '';
    } catch {
      /* private mode */
    }
    setState('busy');
    void (async () => {
      for (let attempt = 1; attempt <= 6; attempt++) {
        try {
          const data = await claimDownload(
            { receiptId: paymentId, planId: product.whopPlanId, productSlug: product.slug, email: email || undefined },
            session?.access_token,
          );
          setResult(data);
          setState('ready');
          return;
        } catch (err) {
          if (err instanceof ApiError && RETRYABLE.has(err.code) && attempt < 6) {
            await new Promise((r) => window.setTimeout(r, 1500 * attempt));
            continue;
          }
          setError(err instanceof Error ? err.message : 'Could not confirm your payment.');
          setState('error');
          return;
        }
      }
    })();
  }, [paymentId, status, product, session?.access_token]);

  if (!paymentId || !status) return null;
  const dismiss = () => setParams({}, { replace: true });

  if (status !== 'succeeded') {
    return (
      <div className="notice glass-panel account__return" role="alert">
        <h2>{status === 'canceled' ? 'Payment canceled' : status === 'failed' ? 'Payment failed' : 'Payment is processing'}</h2>
        <p className="muted">
          {status === 'processing'
            ? 'Your bank is still confirming the payment. We’ll add the file to your account as soon as it clears.'
            : 'You were not charged. You can go back to the project and try again.'}
        </p>
        <div className="modal__actions">
          {product && (
            <Link to={`/item/${product.slug}`} className="btn btn--accent btn--sm">
              Back to {product.title}
            </Link>
          )}
          <button type="button" className="btn btn--glass btn--sm" onClick={dismiss}>
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notice glass-panel account__return" aria-live="polite">
      {state === 'busy' && (
        <p className="account__return-row">
          <span className="spinner" /> Confirming your payment for <strong>{product?.title ?? 'your project'}</strong>…
        </p>
      )}
      {state === 'error' && (
        <>
          <h2>We couldn’t confirm your payment yet</h2>
          <p className="muted">{error}</p>
          <small className="muted">Payment: {paymentId}</small>
        </>
      )}
      {state === 'ready' && result && (
        <>
          <h2 className="account__return-row">
            <Check width={22} height={22} /> Payment successful!
          </h2>
          <div className="license license--compact">
            <div>
              <span className="license__label">License key</span>
              <code className="license__key">{result.licenseKey}</code>
            </div>
            <CopyButton value={result.licenseKey} label="Copy" />
          </div>
          <a className="btn btn--accent btn--sm" href={result.downloadUrl} download={result.fileName} rel="noopener">
            <Download width={16} height={16} /> Download {result.fileName}
          </a>
          {!session && (
            <small className="muted">
              Linked to <strong>{result.email}</strong>. Sign in below with this e-mail to keep all your files in one place.
            </small>
          )}
        </>
      )}
      {state !== 'busy' && (
        <button type="button" className="link-btn" onClick={dismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}

/* --------------------------------- Rules, FAQ & question --------------------------------- */

const RULES = [
  'Every purchase gives you a lifetime license for one person or studio, for unlimited personal and commercial projects.',
  'You may use the templates in client work, ads, social media, film and broadcast. Reselling, sharing or redistributing the source files is not allowed.',
  'Files are delivered instantly as a ZIP. Because they are digital goods, sales are final; if a file is broken or not as described, write to us and we will fix it or refund you.',
  'Your downloads and license keys are tied to the e-mail used at checkout and are always available on this page.',
  'Reviews must be about the project you bought and written by you. We may remove spam or abusive reviews.',
];

const FAQ: { q: string; a: string }[] = [
  { q: 'I paid but don’t see my file', a: 'Sign in with the exact e-mail you entered at checkout. If it still doesn’t show up after a few minutes, ask us below and include your payment e-mail.' },
  { q: 'The download link expired', a: 'Links are valid for a limited time for security. Click “Download ZIP” again here to get a fresh one — as many times as you need.' },
  { q: 'Which software versions are supported?', a: 'Each product page lists the required app version and plugins in its specs. Most projects work in After Effects / Premiere Pro 2022 and newer.' },
  { q: 'Can I use a template for a client?', a: 'Yes. The license covers commercial work, including projects you deliver to clients. The client can’t resell the source files.' },
  { q: 'How do the discount codes work?', a: 'After your first purchase you get a code for 15% off the second one, and from the third purchase on — 20% off every product.' },
  { q: 'How do I get a refund?', a: 'If a file is damaged or not as described, send us a question below within 14 days and we’ll fix it or refund you.' },
];

function AskQuestion({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) textRef.current?.focus();
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError('');
    try {
      await sendContact({ message: message.trim(), email: email.trim() || undefined, website }, session?.access_token);
      setSent(true);
      setMessage('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="ask">
        <button type="button" className="btn btn--glass btn--sm" onClick={() => { setOpen(true); setSent(false); }}>
          Ask a question
        </button>
        {sent && (
          <small className="rate__saved">
            <Check width={13} height={13} /> Sent! We’ll reply by e-mail.
          </small>
        )}
      </div>
    );
  }

  return (
    <form className="ask rate__form" onSubmit={submit}>
      {!session && (
        <label className="field">
          <span>Your e-mail (for the reply)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" autoComplete="email" required />
        </label>
      )}
      <input className="ask__hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden />
      <textarea
        ref={textRef}
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, CONTACT_MAX_LENGTH))}
        placeholder="How can we help?"
        rows={4}
        aria-label="Your question"
        required
      />
      <div className="rate__actions">
        <small className="muted">
          {message.length}/{CONTACT_MAX_LENGTH}
        </small>
        <button type="button" className="btn btn--glass btn--sm" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn--accent btn--sm" disabled={busy || !message.trim()}>
          {busy ? <span className="spinner" /> : null} Send
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}

function AccountHelp({ session }: { session: Session | null }) {
  return (
    <div className="account-help">
      <div className="glass-panel account-help__box">
        <h2>Help &amp; FAQ</h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>{f.q}</summary>
              <p className="muted">{f.a}</p>
            </details>
          ))}
        </div>
        <AskQuestion session={session} />
      </div>
      <div className="glass-panel account-help__box">
        <h2>Service rules</h2>
        <ul className="rules">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** A few of the newest projects from the catalog (same cards as on the home page). */
const FRESH = [...PRODUCTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

function FreshProjects() {
  return (
    <section className="section account-fresh">
      <div className="section__head">
        <div>
          <h2>Fresh projects</h2>
          <p className="muted">Just added to the catalog.</p>
        </div>
        <Link to="/browse" className="btn btn--glass btn--sm">
          View all
        </Link>
      </div>
      <div className="grid">
        {FRESH.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------ Page ------------------------------------------ */

export function Account() {
  const { supabase, ready: configReady } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = 'My Account — Nuova Motion';
  }, []);

  useEffect(() => {
    if (!configReady) return;
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, configReady]);

  return (
    <>
      <section className="section section--page account-page">
        {ready && <PaymentReturn session={session} />}
        {ready && !supabase ? (
          <div className="notice glass-panel">
            <h1>My Account is not available yet</h1>
            <p className="muted">Buyer accounts are not configured on this storefront. Please check back soon.</p>
            {missingConfig.length > 0 && (
              <p className="muted small">
                Server setup: add {missingConfig.join(', ')} to the hosting environment variables and redeploy.
              </p>
            )}
          </div>
        ) : !ready ? (
          <div className="account__loading">
            <span className="spinner spinner--lg" />
          </div>
        ) : session ? (
          <Purchases session={session} />
        ) : (
          <AuthForm />
        )}
        {ready && <AccountHelp session={session} />}
      </section>
      <FreshProjects />
    </>
  );
}
