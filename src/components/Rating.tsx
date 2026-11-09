import type { CSSProperties } from 'react';
import type { RatingStats } from '../types';
import { Star } from './Icons';

const FIVE = [0, 1, 2, 3, 4];

export function Rating({ rating, size = 12, label = 'short' }: { rating: RatingStats; size?: number; label?: 'short' | 'long' }) {
  const fill = { '--fill': `${(rating.average / 5) * 100}%` } as CSSProperties;
  return (
    <span className="rating" title={`${rating.average.toFixed(1)} out of 5 · ${rating.count} reviews`}>
      <span className="stars" style={fill} aria-hidden>
        <span className="stars__row">
          {FIVE.map((i) => (
            <Star key={i} width={size} height={size} />
          ))}
        </span>
        <span className="stars__row stars__row--fill">
          {FIVE.map((i) => (
            <Star key={i} width={size} height={size} />
          ))}
        </span>
      </span>
      <span className="rating__count">
        {label === 'long' ? `${rating.average.toFixed(1)} · ${rating.count} reviews` : `(${rating.count})`}
      </span>
      <span className="sr-only">
        Rated {rating.average.toFixed(1)} out of 5 from {rating.count} reviews
      </span>
    </span>
  );
}
