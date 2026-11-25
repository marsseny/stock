import type { JSX, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const ArrowRight = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Search = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const Bag = (p: P) => (
  <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const Close = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Chevron = (p: P) => (
  <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const Check = (p: P) => (
  <svg {...base} {...p}><path d="m5 12 5 5L20 7" /></svg>
);
export const Copy = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
);
export const Download = (p: P) => (
  <svg {...base} {...p}><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></svg>
);
export const Info = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const Gift = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="8" width="18" height="5" rx="1" /><path d="M5 13v7h14v-7M12 8v12" /><path d="M12 8S10.5 4 8 4a2 2 0 0 0 0 4h4ZM12 8s1.5-4 4-4a2 2 0 0 1 0 4h-4Z" /></svg>
);
export const Ticket = (p: P) => (
  <svg {...base} {...p}><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3v2Z" /><path d="M14 6v12" strokeDasharray="2 2" /></svg>
);
export const User = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const Layers = (p: P) => (
  <svg {...base} {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>
);
export const Star = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none"><path d="m12 3 2.7 5.6 6.2.9-4.5 4.3 1.1 6.1L12 17l-5.5 2.9 1.1-6.1L3.1 9.5l6.2-.9L12 3Z" /></svg>
);
export const SoundOff = (p: P) => (
  <svg {...base} {...p}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m16 9 5 6M21 9l-5 6" /></svg>
);
export const SoundOn = (p: P) => (
  <svg {...base} {...p}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
);
export const Menu = (p: P) => (
  <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const Play = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
);
export const Pause = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base} {...p}><path d="m15 6-6 6 6 6" /></svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>
);

/* ---------- Feature icons (project description) ---------- */

/** Minimal app glyph: rounded square with the two-letter app abbreviation. */
const AppGlyph = ({ letters, ...p }: P & { letters: string }) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <text x="12" y="15.6" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="currentColor" stroke="none" fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing="-0.3">{letters}</text>
  </svg>
);
export const AfterEffects = (p: P) => <AppGlyph letters="Ae" {...p} />;
export const PremierePro = (p: P) => <AppGlyph letters="Pr" {...p} />;
/** Abstract "pack in a panel" mark — a stack of scenes with a play notch. */
export const MotionBroMark = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="14" height="14" rx="3.5" />
    <path d="M7 3.5h10.5A3.5 3.5 0 0 1 21 7v10.5" />
    <path d="m8.5 11 4.5 3-4.5 3v-6Z" fill="currentColor" />
  </svg>
);
export const Resize = (p: P) => (
  <svg {...base} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /><rect x="8.5" y="8.5" width="7" height="7" rx="1.5" /></svg>
);
export const Timeline = (p: P) => (
  <svg {...base} {...p}><path d="M3 7h18M3 17h18" /><rect x="6" y="10" width="10" height="4" rx="1.5" /><path d="M19 10.5v3M17.5 12H21" /></svg>
);
export const Refresh = (p: P) => (
  <svg {...base} {...p}><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 20v-4h-4" /></svg>
);
export const InfinityLoop = (p: P) => (
  <svg {...base} {...p}><path d="M12 12c-2-2.7-3.6-4-5.5-4a4 4 0 0 0 0 8c1.9 0 3.5-1.3 5.5-4Zm0 0c2 2.7 3.6 4 5.5 4a4 4 0 0 0 0-8c-1.9 0-3.5 1.3-5.5 4Z" /></svg>
);
export const Support = (p: P) => (
  <svg {...base} {...p}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.6" /></svg>
);
export const Sliders = (p: P) => (
  <svg {...base} {...p}><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const TextBox = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M7.5 10h6M10.5 10v4.5" /><path d="M17 10.5 19 12l-2 1.5" /></svg>
);
export const PlayCircle = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m10 8.5 5.5 3.5-5.5 3.5v-7Z" fill="currentColor" /></svg>
);
export const Font = (p: P) => (
  <svg {...base} {...p}><path d="M4 19 9.5 5h1L16 19M6.3 14h7.4" /><path d="M17.5 19v-6.5M15.5 12.5h4" /></svg>
);
export const Code = (p: P) => (
  <svg {...base} {...p}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></svg>
);
export const Feather = (p: P) => (
  <svg {...base} {...p}><path d="M20 4c-7 0-13 4.5-13 12v4" /><path d="M7 16c5 0 9-2.5 11-7" /><path d="M10.5 12.5H15" /></svg>
);
export const Sparkle = (p: P) => (
  <svg {...base} {...p}><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" /><path d="M19 16c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z" /></svg>
);
export const Music = (p: P) => (
  <svg {...base} {...p}><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>
);
export const Palette = (p: P) => (
  <svg {...base} {...p}><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.9.7-1.7 1.7-1.7H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.2" r="1" /><circle cx="14.5" cy="7.2" r="1" /></svg>
);
export const Bolt = (p: P) => (
  <svg {...base} {...p}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" /></svg>
);
export const Globe = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z" /></svg>
);

export const Phone = (p: P) => (
  <svg {...base} {...p}><rect x="6.5" y="2.5" width="11" height="19" rx="2.8" /><path d="M10.5 5.5h3" /><path d="M11 18.5h2" /></svg>
);
export const Cube = (p: P) => (
  <svg {...base} {...p}><path d="M12 2.8 20 7.3v9.4l-8 4.5-8-4.5V7.3l8-4.5Z" /><path d="M4 7.3 12 12l8-4.7M12 12v9.2" /></svg>
);
export const Monitor = (p: P) => (
  <svg {...base} {...p}><rect x="2.5" y="4" width="19" height="12.5" rx="2.2" /><path d="M8.5 20.5h7M12 16.5v4" /></svg>
);

/** Icons available to features by name (also for `icon` in `src/data/details/*.json`). */
export const FEATURE_ICONS: Record<string, (p: P) => JSX.Element> = {
  'after-effects': AfterEffects,
  'premiere-pro': PremierePro,
  motionbro: MotionBroMark,
  resize: Resize,
  timeline: Timeline,
  refresh: Refresh,
  infinity: InfinityLoop,
  support: Support,
  sliders: Sliders,
  textbox: TextBox,
  play: PlayCircle,
  font: Font,
  code: Code,
  feather: Feather,
  sparkle: Sparkle,
  music: Music,
  palette: Palette,
  bolt: Bolt,
  globe: Globe,
  layers: Layers,
  check: Check,
  star: Star,
  phone: Phone,
  cube: Cube,
  monitor: Monitor,
};
