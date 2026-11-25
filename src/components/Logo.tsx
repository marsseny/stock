import { useId, type SVGProps } from 'react';

/**
 * Nuova Motion mark: a dark glass tile with a single-stroke "N" drawn as a motion path
 * (peach → lavender gradient) ending in a dot. Same drawing as public/favicon.svg.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden focusable="false" {...props}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2d36" />
          <stop offset="1" stopColor="#140e12" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe3d0" />
          <stop offset="1" stopColor="#b9b2d8" />
        </linearGradient>
      </defs>
      <rect x=".5" y=".5" width="31" height="31" rx="10" fill={`url(#${id}t)`} stroke="#fff" strokeOpacity=".22" />
      <path
        d="M10 22V10.5l12 11V10"
        fill="none"
        stroke={`url(#${id}s)`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="22" r="1.7" fill="#fbe3d0" />
    </svg>
  );
}

/** Logo used in the header and footer: mark + "Nuova Motion" wordmark ("Nuova" bold, "Motion" regular). */
export function Logo() {
  return (
    <>
      <LogoMark className="logo__mark" />
      <span className="logo__word">
        <b>Nuova</b> <span>Motion</span>
      </span>
    </>
  );
}
