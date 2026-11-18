import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { categoryById } from '../data/categories';
import { setSoundOn, useSoundOn } from '../store/sound';
import type { Product } from '../types';
import { Pause, Play, SoundOff, SoundOn } from './Icons';

interface Props {
  product: Product;
  playing: boolean;
  /** Show the sound toggle while the preview plays. */
  sound?: boolean;
  large?: boolean;
  /** Full player controls (product page): play/pause, scrubbable timeline, time, sound. */
  controls?: boolean;
}

/** "0:25" → 25 seconds. Used as the simulated length of placeholder previews. */
const parseDuration = (d?: string) => {
  const m = d?.match(/^(\d+):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 10;
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Renders the product's preview video, or an animated placeholder until real videos exist.
 * Playback is driven by `playing` (hover on cards, autoplay on the product page) and, with
 * `controls`, by the visitor's own play/pause. Sound follows the site-wide preference
 * (`store/sound.ts`): turning it on or off in one preview applies to every other preview.
 */
export function VideoPreview({ product, playing, sound = true, large, controls }: Props) {
  const { video, poster, hueA, hueB, variant } = product.preview;
  const ref = useRef<HTMLVideoElement>(null);
  const soundOn = useSoundOn();
  /** Browser refused to autoplay with sound (no user interaction yet) — play muted until a click. */
  const [blocked, setBlocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(() => (video ? 0 : parseDuration(product.duration)));

  const active = playing && !paused;
  const muted = !soundOn || blocked;

  // Start / stop playback.
  useEffect(() => {
    const el = ref.current;
    if (!playing) {
      setBlocked(false);
      setPaused(false);
      setTime(0);
    }
    if (!el) return;
    if (active) {
      el.muted = muted;
      el.play().catch(() => {
        if (el.muted) return;
        el.muted = true;
        setBlocked(true);
        el.play().catch(() => {});
      });
    } else {
      el.pause();
      if (!playing) el.currentTime = 0;
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  // Timeline clock: reads the real video position, or advances a simulated one for placeholders.
  useEffect(() => {
    if (!controls || !active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const el = ref.current;
      if (el) setTime(el.currentTime);
      else setTime((t) => (t + (now - last) / 1000) % duration);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controls, active, duration]);

  const toggleSound = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (muted) {
      setBlocked(false);
      setSoundOn(true);
      if (ref.current) ref.current.muted = false;
    } else setSoundOn(false);
  };

  const togglePlay = (e: MouseEvent) => {
    e.stopPropagation();
    setPaused((p) => !p);
  };

  const seek = (t: number) => {
    setTime(t);
    if (ref.current) ref.current.currentTime = t;
  };

  const style = { '--ha': hueA, '--hb': hueB } as CSSProperties;
  const soundButton = (
    <button
      type="button"
      className={`preview__sound ${muted ? '' : 'is-on'}`}
      onClick={toggleSound}
      tabIndex={playing || controls ? 0 : -1}
      aria-hidden={!playing && !controls}
      aria-pressed={!muted}
      aria-label={muted ? 'Turn sound on' : 'Mute'}
    >
      {muted ? <SoundOff width={18} height={18} /> : <SoundOn width={18} height={18} />}
    </button>
  );
  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div
      className={`preview ${active ? 'is-playing' : ''} ${large ? 'preview--large' : ''} ${controls ? 'preview--controls' : ''}`}
      style={style}
      onClick={controls ? togglePlay : undefined}
    >
      {video ? (
        <video
          ref={ref}
          src={video}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        />
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

      {controls ? (
        <div className="player" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="player__btn"
            onClick={togglePlay}
            aria-label={active ? 'Pause' : 'Play'}
          >
            {active ? <Pause width={18} height={18} /> : <Play width={18} height={18} />}
          </button>
          <input
            className="player__timeline"
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Math.min(time, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ '--pct': `${pct}%` } as CSSProperties}
            aria-label="Timeline"
            aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
          />
          <span className="player__time">
            {fmt(time)} / {fmt(duration)}
          </span>
          {sound && soundButton}
        </div>
      ) : (
        sound && soundButton
      )}
    </div>
  );
}
