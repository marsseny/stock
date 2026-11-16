import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { CopyButton } from '../components/CopyButton';
import { RateProject } from '../components/RateProject';
import { Download, Gift } from '../components/Icons';
import { VideoPreview } from '../components/VideoPreview';
import { getProduct } from '../data/products';
import { fetchMyReviews, getDownloadUrl, startDownload, type ApiReview } from '../lib/api';
import { promoForPurchases, saveActivePromo } from '../lib/promo';
import { fetchMyPurchases, isSupabaseConfigured, supabase, type Purchase } from '../lib/supabase';

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
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
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
            <small className="muted">Purchased {formatDate(purchase.created_at)}</small>
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
        <RateProject productSlug={purchase.product_slug} review={review} onSaved={onReviewSaved} />
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}

/* ------------------------------------ Signed-in screen ------------------------------------ */

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
      setItems(list);
      const promo = promoForPurchases(list.length);
      if (promo) saveActivePromo(promo.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your purchases.');
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, session.user.id]);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  const promo = items ? promoForPurchases(items.length) : null;

  return (
    <div className="account">
      <div className="account__head">
        <div>
          <span className="modal__eyebrow">My Purchases</span>
          <h1>Your files &amp; licenses</h1>
          <p className="muted">
            Signed in as <strong>{session.user.email}</strong>
          </p>
        </div>
        <button type="button" className="btn btn--glass btn--sm" onClick={signOut}>
          Sign out
        </button>
      </div>

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

/* ------------------------------------------ Page ------------------------------------------ */

export function Account() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = 'My Purchases — Framehaus';
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <section className="section section--page account-page">
      {!isSupabaseConfigured ? (
        <div className="notice glass-panel">
          <h1>My Purchases is not available yet</h1>
          <p className="muted">Buyer accounts are not configured on this storefront. Please check back soon.</p>
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
    </section>
  );
}
