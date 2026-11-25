import type { SVGProps } from 'react';

/** Nuova Motion mark: a peach-cream tile with a forward-leaning "N" (motion). Same drawing as public/favicon.svg. */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" width={28} height={28} aria-hidden focusable="false" {...props}>
      <rect width="32" height="32" rx="9" fill="#f3d3b8" />
      <path d="M9 23 11.6 9H15l3.4 9.2L20.1 9h3.4l-2.6 14h-3.4l-3.4-9.2-1.7 9.2Z" fill="#1c1215" />
    </svg>
  );
}

/** Logo used in the header and footer: mark + "nuovamotion.com" wordmark (the brand name is "Nuova Motion"). */
export function Logo() {
  return (
    <>
      <LogoMark className="logo__mark" />
      <span className="logo__word">
        nuovamotion<span>.com</span>
      </span>
    </>
  );
}
