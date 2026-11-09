import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import type { Product } from '../types';
import { ArrowRight } from './Icons';
import { ProductCard } from './ProductCard';

const DRAG_THRESHOLD = 60;
const WHEEL_THRESHOLD = 40;
const WHEEL_COOLDOWN = 450;

/** Signed circular distance of `i` from `active`, in [-n/2, n/2]. */
function relative(i: number, active: number, n: number) {
  let d = (i - active) % n;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

/**
 * Coverflow-style featured carousel. The active slide is half the viewport wide, neighbours peek at the
 * sides. Navigate by dragging, horizontal wheel / trackpad swipe (or Shift + wheel), arrows, dots or keys.
 */
export function FeaturedCarousel({ products }: { products: Product[] }) {
  const n = products.length;
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, down: false, moved: false });
  const prevRel = useRef<number[]>([]);

  const go = (delta: number) => setActive((a) => (((a + delta) % n) + n) % n);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let acc = 0;
    let last = 0;
    let resetTimer: number | undefined;
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const dx = horizontal ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      acc += dx;
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => (acc = 0), 200);
      if (Math.abs(acc) > WHEEL_THRESHOLD && Date.now() - last > WHEEL_COOLDOWN) {
        setActive((a) => (((a + Math.sign(acc)) % n) + n) % n);
        acc = 0;
        last = Date.now();
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [n]);

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { startX: e.clientX, down: true, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) > 6) {
      drag.current.moved = true;
      stageRef.current?.setPointerCapture(e.pointerId);
    }
    if (drag.current.moved) setDragX(dx);
  };
  const endDrag = () => {
    if (!drag.current.down) return;
    drag.current.down = false;
    if (Math.abs(dragX) > DRAG_THRESHOLD) go(dragX < 0 ? 1 : -1);
    setDragX(0);
  };

  // Swallow the click that ends a drag; a click on a side slide brings it to the centre instead of navigating.
  const onSlideClick = (e: MouseEvent, rel: number) => {
    if (drag.current.moved) {
      drag.current.moved = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (rel !== 0) {
      e.preventDefault();
      e.stopPropagation();
      go(rel);
    }
  };

  const rels = products.map((_, i) => relative(i, active, n));
  // Slides wrapping from one edge to the other jump without animating across the stage.
  const jumps = rels.map((r, i) => prevRel.current[i] !== undefined && Math.abs(r - prevRel.current[i]) > 1);
  useEffect(() => {
    prevRel.current = rels;
  });

  return (
    <section className="carousel" aria-roledescription="carousel" aria-label="Featured projects">
      <div
        ref={stageRef}
        className={`carousel__stage ${dragX ? 'is-dragging' : ''}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
      >
        {products.map((p, i) => {
          const rel = rels[i];
          const style = {
            '--rel': rel,
            '--abs': Math.abs(rel),
            '--drag': `${dragX}px`,
            zIndex: 10 - Math.abs(rel),
            transition: jumps[i] || dragX ? 'none' : undefined,
          } as CSSProperties;
          return (
            <div
              key={p.id}
              className={`carousel__slide ${rel === 0 ? 'is-active' : ''}`}
              style={style}
              aria-hidden={rel !== 0}
              onClickCapture={(e) => onSlideClick(e, rel)}
            >
              <ProductCard product={p} autoPlay={rel === 0} />
            </div>
          );
        })}
      </div>

      <div className="carousel__nav">
        <button className="btn btn--glass btn--icon" onClick={() => go(-1)} aria-label="Previous">
          <ArrowRight style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div className="carousel__dots">
          {products.map((p, i) => (
            <button
              key={p.id}
              className={`carousel__dot ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Show ${p.title}`}
            />
          ))}
        </div>
        <button className="btn btn--glass btn--icon" onClick={() => go(1)} aria-label="Next">
          <ArrowRight />
        </button>
      </div>
    </section>
  );
}
