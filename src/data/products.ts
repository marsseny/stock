import type { CategoryId, Product, Tier } from '../types';
import { mulberry32 } from './random';
import { computeRating } from './ratings';

/**
 * Mock catalog. Deterministic so URLs/slugs are stable between reloads.
 * Swap `PRODUCTS` for API data later — the rest of the app only uses the helpers below.
 */

const rand = mulberry32(20261109);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));
const sample = <T,>(arr: readonly T[], n: number) => {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
};

const ADJECTIVES = [
  'Cinematic', 'Kinetic', 'Neon', 'Minimal', 'Glitch', 'Liquid', 'Retro', 'Urban', 'Clean', 'Dynamic',
  'Epic', 'Modern', 'Elegant', 'Bold', 'Analog', 'Chrome', 'Vapor', 'Grain', 'Hyper', 'Swiss',
  'Prism', 'Lunar', 'Sharp', 'Organic', 'Pulse', 'Noir', 'Mono', 'Aurora', 'Brutal', 'Velvet',
];

const NOUNS: Record<CategoryId, string[]> = {
  'after-effects': [
    'Opener', 'Logo Reveal', 'Titles', 'Slideshow', 'Promo', 'Lower Thirds', 'Typography',
    'Intro', 'Infographics', 'Event Promo', 'Product Promo', 'Trailer', 'Call-outs', 'HUD Elements',
  ],
  'premiere-pro': [
    'Transitions', 'Titles', 'Social Reels', 'Lower Thirds', 'Text Presets', 'Vlog Kit',
    'Split Screens', 'Captions', 'Intro', 'Sound Bars', 'YouTube Toolkit',
  ],
  plugins: [
    'Motion Tool', 'Auto Rigger', 'Shape Animator', 'Text Builder', 'Easing Script',
    'Render Manager', 'Grid Generator', 'Color Panel', 'Layer Organizer', 'Glow',
  ],
  'davinci-resolve': ['Titles', 'Transitions', 'Fusion Macros', 'Lower Thirds', 'Opener', 'Glitch Effects'],
  presets: ['LUT Collection', 'Film Emulation', 'Color Grades', 'Light Leaks', 'Overlays', 'Text Presets'],
  'sound-fx': ['Whooshes', 'Risers', 'UI Sounds', 'Impacts', 'Transitions SFX', 'Glitch SFX'],
};

const TAGS: Record<CategoryId, string[]> = {
  'after-effects': [
    'titles', 'logo', 'opener', 'slideshow', 'typography', 'promo', 'corporate', 'social media',
    'glitch', '3d', 'infographics', 'lower thirds', 'trailer', 'hud', 'minimal', 'kinetic',
  ],
  'premiere-pro': [
    'transitions', 'titles', 'mogrt', 'social media', 'vlog', 'youtube', 'captions',
    'lower thirds', 'minimal', 'glitch', 'reels', 'split screen',
  ],
  plugins: ['script', 'extension', 'workflow', 'animation', 'rigging', 'text', 'color', 'shapes', 'render'],
  'davinci-resolve': ['fusion', 'titles', 'transitions', 'macros', 'glitch', 'lower thirds', 'opener'],
  presets: ['lut', 'color grading', 'film', 'cinematic', 'overlays', 'light leaks', 'vintage'],
  'sound-fx': ['sfx', 'whoosh', 'riser', 'ui', 'impact', 'transitions', 'glitch'],
};

const AUTHORS = [
  'Northlight Studio', 'Pixel Foundry', 'Motion Lab', 'Hexa Visuals', 'Grainhaus', 'Orbit Motion',
  'Kinetica', 'Frame Theory', 'Studio Wavelength', 'Monoframe', 'Lumen Works', 'Cut & Code',
];

const COMPAT: Record<CategoryId, string[]> = {
  'after-effects': ['After Effects CC 2020+', 'After Effects CC 2022+', 'After Effects 2024+'],
  'premiere-pro': ['Premiere Pro CC 2021+', 'Premiere Pro 2023+'],
  plugins: ['After Effects CC 2019+', 'After Effects & Premiere Pro 2022+'],
  'davinci-resolve': ['DaVinci Resolve 18+', 'DaVinci Resolve 19+'],
  presets: ['Premiere Pro, Resolve, FCPX', 'Any NLE (.cube)'],
  'sound-fx': ['WAV 48kHz / 24-bit'],
};

type Summary = (adj: string, noun: string) => string;

const SUMMARIES: Record<CategoryId, Summary[]> = {
  'after-effects': [
    (a, n) => `${a} ${n} with smooth motion and one-click color controls.`,
    (_, n) => `Punchy ${n} for brands, events and social — render-ready in minutes.`,
    (a, n) => `Customizable ${a.toLowerCase()} ${n} with drop zones for your media and text.`,
  ],
  'premiere-pro': [
    (_, n) => `Drag-and-drop ${n} as MOGRTs — edit right in the Essential Graphics panel.`,
    (a, n) => `${a} ${n} made for YouTube, Reels and TikTok edits.`,
    (a, n) => `Fast ${a.toLowerCase()} ${n} that adapt to any resolution and duration.`,
  ],
  plugins: [
    (_, n) => `A lightweight ${n} panel that turns ten clicks into one.`,
    (_, n) => `${n[0].toUpperCase() + n.slice(1)} that automates repetitive keyframing and saves hours.`,
  ],
  'davinci-resolve': [
    (a, n) => `${a} ${n} for the Edit page, fully adjustable in the Inspector.`,
    (_, n) => `Drag-and-drop ${n} for DaVinci Resolve with smooth, eased motion.`,
  ],
  presets: [
    (a, n) => `${a} ${n} that give footage a consistent, filmic look in one click.`,
    (_, n) => `Hand-tuned ${n} for log and Rec.709 footage.`,
  ],
  'sound-fx': [
    (a, n) => `${a} ${n} designed to sync with motion graphics and cuts.`,
    (_, n) => `Clean, punchy ${n} — mixed, mastered and ready for your timeline.`,
  ],
};

const CATEGORY_WEIGHTS: CategoryId[] = [
  'after-effects', 'after-effects', 'after-effects', 'after-effects',
  'premiere-pro', 'premiere-pro', 'premiere-pro',
  'plugins', 'plugins',
  'davinci-resolve', 'presets', 'sound-fx',
];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const TOTAL = 84;

function tierFor(i: number): Tier {
  if (i % 10 === 0 || i === 3) return 'featured';
  if (i % 5 === 2 || i % 9 === 4) return 'pack';
  return 'basic';
}

function priceFor(tier: Tier, category: CategoryId) {
  if (tier === 'pack') return pick([49, 59, 69, 79, 99, 129, 149]);
  if (category === 'plugins') return pick([19, 29, 39, 49, 69, 99]);
  if (tier === 'featured') return pick([29, 35, 39, 45, 49, 59]);
  return pick([9, 12, 15, 18, 19, 24, 29]);
}

function build(): Product[] {
  const used = new Set<string>();
  const products: Product[] = [];
  const now = Date.UTC(2026, 10, 9);

  for (let i = 0; i < TOTAL; i++) {
    const category = CATEGORY_WEIGHTS[i % CATEGORY_WEIGHTS.length];
    const tier = tierFor(i);

    let title = '';
    let adj = '';
    let noun = '';
    do {
      adj = pick(ADJECTIVES);
      noun = pick(NOUNS[category]);
      title = `${adj} ${noun}`;
      if (tier === 'pack') title += pick([' Pack', ' Bundle', ' Mega Pack', ' Collection']);
    } while (used.has(title));
    used.add(title);

    const price = priceFor(tier, category);
    const onSale = rand() < 0.18;
    const itemsCount = tier === 'pack' ? between(4, 40) * 10 : undefined;
    const summary =
      tier === 'pack'
        ? `${itemsCount} ready-to-use ${noun.toLowerCase()} in one ${adj.toLowerCase()} style — a whole toolkit in a single download.`
        : pick(SUMMARIES[category])(adj, noun.toLowerCase());
    const createdAt = new Date(now - between(1, 420) * 86_400_000).toISOString();
    const id = `p${String(i + 1).padStart(3, '0')}`;
    const isAudio = category === 'sound-fx';
    const isTool = category === 'plugins' || category === 'presets';
    const tags = sample(TAGS[category], between(3, 5));
    if (tier === 'pack' && !tags.includes('bundle')) tags.push('bundle');

    products.push({
      id,
      slug: slugify(title),
      title,
      summary,
      author: pick(AUTHORS),
      category,
      tier,
      tags,
      price,
      oldPrice: onSale ? Math.round(price * 1.5) : undefined,
      itemsCount,
      includes:
        tier === 'pack'
          ? sample(NOUNS[category], Math.min(6, NOUNS[category].length)).map((n) => `${pick(ADJECTIVES)} ${n}`)
          : undefined,
      resolution: isAudio ? '—' : isTool ? 'Resolution independent' : pick(['1920×1080', '3840×2160 (4K)', '1080×1920 (Vertical)']),
      duration: isAudio || isTool ? undefined : `0:${String(between(8, 59)).padStart(2, '0')}`,
      compatibility: pick(COMPAT[category]),
      fileSize: tier === 'pack' ? `${between(2, 18)}.${between(0, 9)} GB` : `${between(40, 900)} MB`,
      pluginsRequired: category === 'after-effects' ? rand() < 0.2 : false,
      createdAt,
      rating: computeRating(id, createdAt, tier === 'featured' ? 1.6 : tier === 'pack' ? 1.2 : 0.8 + rand() * 0.4),
      description:
        tier === 'pack'
          ? `A complete ${title.toLowerCase()} with ${itemsCount} ready-to-use elements. Everything is organized, color-controllable and easy to customize — drop it into your timeline and render.`
          : `${title} is a fully customizable project with clean structure, easy controls and a detailed video tutorial. Change text, colors and media in minutes.`,
      preview: {
        hueA: between(0, 360),
        hueB: between(0, 360),
        variant: i % 6,
      },
    });
  }
  return products;
}

export const PRODUCTS: Product[] = build();

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const FEATURED = PRODUCTS.filter((p) => p.tier === 'featured');

export const ALL_TAGS: string[] = (() => {
  const counts = new Map<string, number>();
  PRODUCTS.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
})();

export const countByCategory = (id: CategoryId) => PRODUCTS.filter((p) => p.category === id).length;

export function related(product: Product, n = 4) {
  return PRODUCTS.filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score: (p.category === product.category ? 2 : 0) + p.tags.filter((t) => product.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.p);
}

export type SortKey = 'popular' | 'newest' | 'price-asc' | 'price-desc';
export type TierFilter = Tier | 'all';

export interface CatalogQuery {
  category?: CategoryId | null;
  tier?: TierFilter;
  tags?: string[];
  q?: string;
  sort?: SortKey;
}

export function queryProducts({ category, tier = 'all', tags = [], q = '', sort = 'popular' }: CatalogQuery) {
  const needle = q.trim().toLowerCase();
  const list = PRODUCTS.filter(
    (p) =>
      (!category || p.category === category) &&
      (tier === 'all' || p.tier === tier) &&
      tags.every((t) => p.tags.includes(t)) &&
      (!needle ||
        p.title.toLowerCase().includes(needle) ||
        p.author.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.includes(needle))),
  );
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    popular: (a, b) => b.rating.count - a.rating.count,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
  };
  return list.sort(sorters[sort]);
}

export const formatPrice = (n: number) => `$${n}`;
