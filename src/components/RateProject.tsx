import { useEffect, useRef, useState, type FormEvent } from 'react';
import { REVIEW_MAX_LENGTH, submitReview, type ApiReview } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Check, Star } from './Icons';

interface Props {
  productSlug: string;
  /** The buyer's existing review of this project, if any. */
  review?: ApiReview;
  onSaved: (review: ApiReview) => void;
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

/**
 * Star rating for a purchased project (My Purchases). Clicking a star opens a small comment box;
 * "Post review" stores it via POST /api/reviews and it appears on the product page.
 */
export function RateProject({ productSlug, review, onSaved }: Props) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(review?.comment ?? '');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? '');
  }, [review?.id, review?.rating, review?.comment]);

  useEffect(() => {
    if (open) textRef.current?.focus();
  }, [open]);

  const pick = (n: number) => {
    setRating(n);
    setOpen(true);
    setError('');
    setJustSaved(false);
  };

  const cancel = () => {
    setOpen(false);
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? '');
    setError('');
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || rating < 1) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      const saved = await submitReview({ productSlug, rating, comment: comment.trim() }, token);
      onSaved(saved);
      setOpen(false);
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your review.');
    } finally {
      setBusy(false);
    }
  };

  const shown = hover || rating;

  return (
    <div className={`rate ${open ? 'is-open' : ''}`}>
      <div className="rate__row">
        <span className="license__label">{review ? 'Your review' : 'Rate this project'}</span>
        <div className="rate__stars" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className={`rate__star ${n <= shown ? 'is-on' : ''}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => pick(n)}
            >
              <Star width={20} height={20} />
            </button>
          ))}
        </div>
        {shown > 0 && <small className="muted rate__label">{LABELS[shown]}</small>}
        {justSaved && !open && (
          <small className="rate__saved">
            <Check width={13} height={13} /> Thanks! Your review is live.
          </small>
        )}
      </div>

      {!open && review?.comment && <p className="rate__comment">“{review.comment}”</p>}

      {open && (
        <form className="rate__form" onSubmit={save}>
          <textarea
            ref={textRef}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, REVIEW_MAX_LENGTH))}
            placeholder="A short comment (optional) — what did you like?"
            rows={2}
            maxLength={REVIEW_MAX_LENGTH}
            aria-label="Review comment"
          />
          <div className="rate__actions">
            <small className="muted">
              {comment.length}/{REVIEW_MAX_LENGTH}
            </small>
            <button type="button" className="btn btn--glass btn--sm" onClick={cancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn--accent btn--sm" disabled={busy || rating < 1}>
              {busy ? <span className="spinner" /> : null}
              {review ? 'Update review' : 'Post review'}
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
