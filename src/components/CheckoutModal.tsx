import type { Session } from '@supabase/supabase-js';
import { loadWhop } from '@whop/elements';
import { Checkout, CheckoutElement, WhopElements } from '@whop/elements-react';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { formatPrice } from '../data/products';
import { ApiError, claimDownload, claimFree, type ClaimDownloadResult } from '../lib/api';
import { clearActivePromo, discountedPrice, isFreePromo, lookupPromo, PROMO_SECOND, PROMO_THIRD, type PromoInfo } from '../lib/promo';
import { useSupabase } from '../lib/supabase';
import type { Product } from '../types';
import { CopyButton } from './CopyButton';
import { Check, Close, Download, Gift } from './Icons';
import { PromoCodeField } from './PromoCodeField';
import { TaxHint } from './TaxHint';

/**
 * One-window purchase:
 *   details   — e-mail (typed by the buyer) + promo code; no account needed
 *   pay       — embedded Whop checkout, e-mail locked to the one from step 1
 *   verifying — /claim-download (paid) or /claim-free (100% promo)
 *   ready     — license key + presigned R2 ZIP link
 */
type Stage = 'details' | 'pay' | 'verifying' | 'ready' | 'error';

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
  /** Promo the buyer already applied on the page (typed by them, never automatic). */
  promo?: PromoInfo | null;
}

const RETRYABLE = new Set(['payment_not_completed', 'receipt_not_found', 'network_error', 'internal_error']);
const MAX_ATTEMPTS = 6;
const RETRY_DELAY_MS = 1500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAST_EMAIL_KEY = 'fh_checkout_email';

/** The Whop Elements SDK is loaded once per page, on the first checkout that reaches the payment step. */
let whopLoad: ReturnType<typeof loadWhop> | null = null;
const getWhop = () => (whopLoad ??= loadWhop());

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

function readLastEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export function CheckoutModal({ product, open, onClose, promo: initialPromo = null }: Props) {
  const { supabase } = useSupabase();
  const [stage, setStage] = useState<Stage>('details');
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [promo, setPromo] = useState<PromoInfo | null>(null);
  const [result, setResult] = useState<ClaimDownloadResult | null>(null);
  const [error, setError] = useState('');
  const receiptRef = useRef<{ planId: string; receiptId: string } | null>(null);
  const aliveRef = useRef(true);
  const ids = useId();

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Fresh checkout every time the modal is opened.
  useEffect(() => {
    if (!open) return;
    setStage('details');
    setResult(null);
    setError('');
    setEmailError('');
    setPromo(initialPromo);
    setEmail((prev) => prev || readLastEmail());
    receiptRef.current = null;
  }, [open, product.slug, initialPromo]);

  // Buyers signed in to My Account (e-mail link) get their account e-mail; signing in is optional.
  useEffect(() => {
    if (!open || !supabase) return;
    let cancelled = false;
    const apply = (next: Session | null) => {
      if (cancelled) return;
      setSession(next);
      if (next?.user.email) setEmail(next.user.email.toLowerCase());
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => apply(next));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [open, supabase]);

  // Lock page scroll; Escape closes (except while the payment is being confirmed).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stage !== 'verifying') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, stage, onClose]);

  const accessToken = async (): Promise<string | undefined> => {
    if (!supabase) return undefined;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const finish = (data: ClaimDownloadResult) => {
    // The applied code is used up; the next loyalty code is only shown — the buyer types it next time.
    clearActivePromo();
    setResult(data);
    setStage('ready');
  };

  const fail = (err: unknown, fallback: string) => {
    setError(err instanceof Error ? err.message : fallback);
    setStage('error');
  };

  /* ----------------------------- step 1: details ----------------------------- */

  const claimFreeNow = useCallback(
    async (code: string, buyerEmail: string) => {
      setStage('verifying');
      setError('');
      try {
        const data = await claimFree({ productSlug: product.slug, promoCode: code, email: buyerEmail }, await accessToken());
        if (aliveRef.current) finish(data);
      } catch (err) {
        if (aliveRef.current) fail(err, 'Something went wrong while preparing your file.');
      }
    },
    [product.slug],
  );

  const onContinue = (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setEmailError('Enter a valid e-mail address.');
      return;
    }
    setEmail(clean);
    try {
      localStorage.setItem(LAST_EMAIL_KEY, clean);
    } catch {
      /* private mode */
    }
    if (promo && isFreePromo(promo)) void claimFreeNow(promo.code, clean);
    else setStage('pay');
  };

  const useAnotherEmail = async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setEmail('');
  };

  /* ------------------------------ step 2: Whop ------------------------------ */

  const claimPaid = useCallback(async () => {
    const receipt = receiptRef.current;
    if (!receipt) return;
    setStage('verifying');
    setError('');
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const data = await claimDownload(
          { receiptId: receipt.receiptId, planId: receipt.planId, productSlug: product.slug, email },
          await accessToken(),
        );
        if (aliveRef.current) finish(data);
        return;
      } catch (err) {
        if (err instanceof ApiError && RETRYABLE.has(err.code) && attempt < MAX_ATTEMPTS) {
          await wait(RETRY_DELAY_MS * attempt);
          if (!aliveRef.current) return;
          continue;
        }
        if (aliveRef.current) fail(err, 'Something went wrong while confirming your payment.');
        return;
      }
    }
  }, [product.slug, email]);

  const onComplete = (planId: string, receiptId: string | undefined) => {
    if (receiptRef.current) return; // Whop may re-fire completion for a restored session
    if (!receiptId) {
      setError(`Your payment went through, but the checkout did not return a receipt. Sign in to My Account with ${email} to get your file.`);
      setStage('error');
      return;
    }
    receiptRef.current = { planId: planId || product.whopPlanId, receiptId };
    void claimPaid();
  };

  if (!open) return null;

  const price = discountedPrice(product.price, promo);
  const freeMode = isFreePromo(promo);
  // No code after free files only (the server returns an empty code until the first paid purchase).
  const nextPromo = result?.nextPromoCode
    ? (lookupPromo(result.nextPromoCode) ?? { code: result.nextPromoCode, percent: result.nextDiscountPercent })
    : null;
  const isFirstPurchase = (nextPromo?.percent ?? 0) < 20;
  const fileName = result?.fileName || `${product.title}.zip`;
  const canClose = stage !== 'verifying';
  const eyebrow = stage === 'ready' ? 'Order complete' : stage === 'details' ? 'Step 1 of 2 · Your e-mail' : stage === 'pay' ? 'Step 2 of 2 · Payment' : 'Secure checkout';

  return createPortal(
    <div className="modal" role="presentation">
      <div className="modal__scrim" onClick={canClose ? onClose : undefined} />
      <div className={`modal__panel glass-panel modal__panel--${stage}`} role="dialog" aria-modal="true" aria-labelledby={`${ids}-title`}>
        <header className="modal__head">
          <div className="modal__product">
            <span className="modal__eyebrow">{eyebrow}</span>
            <h2 id={`${ids}-title`}>{product.title}</h2>
          </div>
          <div className="modal__price">
            <div className="price">
              {promo && <s>{formatPrice(product.price)}</s>}
              <strong>{formatPrice(price)}</strong>
            </div>
            <TaxHint />
          </div>
          <button type="button" className="btn btn--glass btn--icon" onClick={onClose} disabled={!canClose} aria-label="Close checkout">
            <Close />
          </button>
        </header>

        {stage === 'details' && (
          <form className="modal__body checkout-details" onSubmit={onContinue} noValidate>
            {session?.user.email ? (
              <div className="checkout-details__account">
                <span className="muted">Signed in as</span> <strong>{session.user.email}</strong>
                <button type="button" className="link-btn" onClick={() => void useAnotherEmail()}>
                  Use another e-mail
                </button>
              </div>
            ) : (
              <>
                <label className="field" htmlFor={`${ids}-email`}>
                  <span>E-mail for your download &amp; license</span>
                  <input
                    id={`${ids}-email`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="you@studio.com"
                    autoComplete="email"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? `${ids}-email-err` : undefined}
                    required
                    autoFocus
                  />
                </label>
                {emailError && (
                  <p id={`${ids}-email-err`} className="form-error" role="alert">
                    {emailError}
                  </p>
                )}
              </>
            )}

            <PromoCodeField value={promo} onChange={setPromo} />

            <button type="submit" className="btn btn--accent btn--lg btn--block">
              {freeMode ? (
                <>
                  <Download /> Get it free
                </>
              ) : (
                <>Continue to payment · {formatPrice(price)}</>
              )}
            </button>
            <small className="muted center modal__fine">
              No account needed. Sign in to My Account later with this e-mail to re-download your files.
            </small>
          </form>
        )}

        {stage === 'pay' && (
          <div className="modal__body">
            <div className="checkout-details__account">
              <span className="muted">Delivering to</span> <strong>{email}</strong>
              <button type="button" className="link-btn" onClick={() => setStage('details')}>
                Change
              </button>
            </div>
            <div className="whop-frame">
              <WhopElements
                elements={getWhop()}
                appearance={{ theme: { appearance: 'dark', accentColor: 'lime', grayColor: 'slate' } }}
                onLoadError={(err) => {
                  whopLoad = null; // allow a fresh load on the next attempt
                  fail(err, 'The secure checkout could not be loaded.');
                }}
              >
                <Checkout
                  key={`${product.whopPlanId}-${email}-${promo?.code ?? ''}`}
                  plan={product.whopPlanId}
                  promoCode={promo?.code}
                  metadata={{ product_slug: product.slug, buyer_email: email }}
                  returnUrl={`${window.location.origin}/account?product=${encodeURIComponent(product.slug)}`}
                  onComplete={(c) => {
                    if (c.result === 'payment') onComplete(product.whopPlanId, c.paymentId);
                  }}
                  fallback={
                    <div className="whop-frame__loading">
                      <span className="spinner" /> Loading secure checkout…
                    </div>
                  }
                >
                  <CheckoutElement
                    buyerEmail={email}
                    lockBuyerEmail
                    onError={(e) => fail(new Error(e.message), 'The secure checkout could not be loaded.')}
                  />
                </Checkout>
              </WhopElements>
            </div>
            <small className="muted center modal__fine">Lifetime license · commercial use · instant download</small>
          </div>
        )}

        {stage === 'verifying' && (
          <div className="modal__body modal__state" aria-live="polite">
            <span className="spinner spinner--lg" />
            <h3>Hang tight…</h3>
            <p className="muted">{freeMode ? 'Preparing your download link…' : 'Confirming your payment & preparing your download link…'}</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="modal__body modal__state" role="alert">
            <h3>{freeMode ? 'We couldn’t prepare your file' : 'We couldn’t confirm your payment yet'}</h3>
            <p className="muted">{error}</p>
            <div className="modal__actions">
              {(receiptRef.current || freeMode) && (
                <button
                  type="button"
                  className="btn btn--accent btn--lg"
                  onClick={() => void (freeMode && promo ? claimFreeNow(promo.code, email) : claimPaid())}
                >
                  Try again
                </button>
              )}
              {!receiptRef.current && (
                <button type="button" className="btn btn--glass btn--lg" onClick={() => setStage('details')}>
                  Back
                </button>
              )}
              <Link to="/account" className="btn btn--glass btn--lg" onClick={onClose}>
                Open My Account
              </Link>
            </div>
            {receiptRef.current && <small className="muted">Receipt: {receiptRef.current.receiptId}</small>}
          </div>
        )}

        {stage === 'ready' && result && (
          <div className="modal__body delivery">
            <div className="delivery__hero">
              <span className="delivery__check">
                <Check width={26} height={26} />
              </span>
              <h3>{freeMode ? 'All set!' : 'Payment successful!'} Your file &amp; license are ready.</h3>
            </div>

            <div className="license">
              <div>
                <span className="license__label">License key</span>
                <code className="license__key">{result.licenseKey}</code>
              </div>
              <CopyButton value={result.licenseKey} label="Copy key" />
            </div>

            <a className="btn btn--accent btn--lg btn--block delivery__download" href={result.downloadUrl} download={fileName} rel="noopener">
              <Download /> Download {fileName}
            </a>

            {nextPromo && (
              <div className="offer" role="note">
                <Gift width={26} height={26} className="offer__icon" />
                <p>
                  {isFirstPurchase ? (
                    <>
                      🎁 Special Offer: Get <strong>15% OFF</strong> your 2nd product with promo code{' '}
                      <strong className="offer__code">{nextPromo.code || PROMO_SECOND}</strong> — and <strong>20% OFF</strong> on your 3rd and all
                      subsequent products!
                    </>
                  ) : (
                    <>
                      🎁 VIP Tier Unlocked: Get <strong>20% OFF</strong> your 3rd and all future products with promo code{' '}
                      <strong className="offer__code">{nextPromo.code || PROMO_THIRD}</strong>!
                    </>
                  )}
                </p>
                <CopyButton value={nextPromo.code} label={`Copy ${nextPromo.code}`} />
              </div>
            )}

            <p className="delivery__foot muted">
              Linked to <strong>{result.email}</strong>. Sign in to{' '}
              <Link to="/account" onClick={onClose}>
                <strong>My Account</strong>
              </Link>{' '}
              with this e-mail (sign-in link) to re-download your files anytime.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
