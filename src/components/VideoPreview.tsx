import { useEffect, useRef, type CSSProperties } from 'react';
import { categoryById } from '../data/categories';
import type { Product } from '../types';

interface Props {
  product: Product;
  playing: boolean;
  large?: boolean;
}

/**
 * Renders the product's preview video, or an animated placeholder until real videos exist.
 * Playback is driven by `playing` (hover on cards, always-on on the product page).
 */
export function VideoPreview({ product, playing, large }: Props) {
  const { video, poster, hueA, hueB, variant } = product.preview;
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else {
      el.pause();
      el.currentTime = 0;
    }
  }, [playing]);

  const style = { '--ha': hueA, '--hb': hueB } as CSSProperties;

  return (
    <div className={`preview ${playing ? 'is-playing' : ''} ${large ? 'preview--large' : ''}`} style={style}>
      {video ? (
        <video ref={ref} src={video} poster={poster} muted loop playsInline preload="metadata" />
      ) : (
        <div className={`ph ph--v${variant}`} aria-hidden>
          <div className="ph__bg" />
          <div className="ph__shape ph__shape--a" />
          <div className="ph__shape ph__shape--b" />
          <div className="ph__shape ph__shape--c" />
          <div className="ph__title">
            <span>{product.title.split(' ')[0]}</span>
            <span>{product.title.split(' ').slice(1).join(' ')}</span>
          </div>
          <div className="ph__meta">
            <span>{categoryById(product.category).label}</span>
            <span>Preview placeholder</span>
          </div>
          <div className="ph__grain" />
        </div>
      )}
      <div className="preview__progress" aria-hidden>
        <span />
      </div>
    </div>
  );
}
