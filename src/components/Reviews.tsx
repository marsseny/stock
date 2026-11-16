import { useEffect, useRef } from 'react';
import { formatReviewDate } from '../data/reviews';
import type { ReviewSummary } from '../lib/useProductReviews';
import type { Product, Review } from '../types';
import { Check, Close, Star } from './Icons';

const PREVIEW_COUNT = 4;

function Stars({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} width={13} height={13} className={n <= value ? 'is-on' : ''} />
      ))}
    </span>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="review">
      <div className="review__head">
        <span className="review__avatar" aria-hidden>
          {review.author[0]}
        </span>
        <div className="review__who">
          <b>{review.author}</b>
          <small className="muted">
            {review.verified && (
              <span className="review__verified">
                <Check width={11} height={11} /> Verified buyer ·{' '}
              </span>
            )}
            {formatReviewDate(review.date)}
          </small>
        </div>
        <Stars value={review.rating} />
      </div>
      {review.text && <p>{review.text}</p>}
    </li>
  );
}

/** Glass panel under the buy box: the latest few reviews and a "Read all" button. */
export function ReviewsPanel({ product, summary, id }: { product: Product; summary: ReviewSummary; id?: string }) {
  const { reviews, rating, count } = summary;
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => e.target === el && el.close();
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, []);

  return (
    <section id={id} className="reviews glass-panel" aria-label="Reviews">
      <div className="reviews__head">
        <h2>Reviews</h2>
        <span className="rating">
          <Star width={15} height={15} /> {rating.toFixed(1)}
          <span className="muted">· {count.toLocaleString('en-US')}</span>
        </span>
      </div>

      <ul className="reviews__list">
        {reviews.slice(0, PREVIEW_COUNT).map((r) => (
          <ReviewItem key={r.id} review={r} />
        ))}
      </ul>

      {reviews.length > PREVIEW_COUNT && (
        <button className="btn btn--glass btn--block" onClick={() => dialog.current?.showModal()}>
          Read all {reviews.length.toLocaleString('en-US')} reviews
        </button>
      )}

      <dialog ref={dialog} className="reviews-dialog glass-panel" aria-label={`All reviews for ${product.title}`}>
        <div className="reviews-dialog__head">
          <div>
            <h2>All reviews</h2>
            <span className="rating">
              <Star width={15} height={15} /> {rating.toFixed(1)}
              <span className="muted">
                · {count.toLocaleString('en-US')} reviews · {product.title}
              </span>
            </span>
          </div>
          <button className="btn btn--glass btn--icon" onClick={() => dialog.current?.close()} aria-label="Close reviews">
            <Close />
          </button>
        </div>
        <ul className="reviews__list reviews-dialog__list">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      </dialog>
    </section>
  );
}
