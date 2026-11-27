import { useId, type SVGProps } from 'react';

/**
 * nuovamotion mark (v23): no tile — a heavy, rounded lower-case "n" (one thick stroke) in a soft white →
 * warm-grey gradient, sitting in its own blurred glow so the letter looks bold and out of focus at the
 * edges, with a crisp core on top. Same drawing as public/favicon.svg (the favicon adds a dark disc
 * behind it so it reads on light browser tabs).
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, '');
  const n = 'M10 24V15.6C10 11.9 12.6 9.4 16 9.4S22 11.9 22 15.6V24';
  return (
    <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden focusable="false" overflow="visible" {...props}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#efe6df" />
          <stop offset="1" stopColor="#b9aea6" />
        </linearGradient>
        <filter id={`${id}halo`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <filter id={`${id}soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation=".7" />
        </filter>
      </defs>
      <path d={n} fill="none" stroke="#f3e4d8" strokeOpacity=".55" strokeWidth="9" strokeLinecap="round" filter={`url(#${id}halo)`} />
      <path d={n} fill="none" stroke={`url(#${id}g)`} strokeWidth="7.4" strokeLinecap="round" filter={`url(#${id}soft)`} />
    </svg>
  );
}

/** Logo used in the header and footer: mark + "nuovamotion" wordmark in lower case ("nuova" bold, "motion" light). */
export function Logo() {
  return (
    <>
      <LogoMark className="logo__mark" />
      <span className="logo__word">
        <b>nuova</b>
        <span>motion</span>
      </span>
    </>
  );
}
