import type { Feature, FeatureSize, FeatureTone, Product, ProjectDetails, SceneGroup } from '../types';

/**
 * Detailed description of a project (the block under the video on the product page).
 *
 * Every project gets a complete description automatically, built from the defaults below.
 * To edit it by hand, create `src/data/details/<slug>.json` (see `docs/DESCRIPTION-GUIDE.md`
 * and `docs/details-template.json`). Anything set in that file replaces the default; anything
 * left out keeps the default.
 */

/* ---------- Shape of src/data/details/<slug>.json ---------- */

type FeatureOverride = Partial<Pick<Feature, 'title' | 'text' | 'icon' | 'size' | 'tone' | 'value' | 'tag'>>;
/** `true` — show with default text, `false` — hide, string — value (e.g. "750+"), object — custom text. */
type FeatureSetting = boolean | string | FeatureOverride;

interface ExtraFeature extends FeatureOverride {
  title: string;
}

interface SceneGroupInput {
  title: string;
  count?: number;
  /** Explicit list of image URLs. */
  images?: string[];
  /** Or a folder with numbered files: 01.jpg, 02.jpg, … (`count` files). */
  folder?: string;
  ext?: string;
}

export interface DetailsFile {
  summary?: string;
  /** Which application the project is for. Default: from the project category. */
  application?: 'after-effects' | 'premiere-pro';
  /** Key features of featured projects. Shown only for featured projects unless `showFeatured` is true. */
  featured?: Partial<Record<FeaturedKey, FeatureSetting>>;
  showFeatured?: boolean;
  /** Features shared by all After Effects / Premiere Pro projects. */
  standard?: Partial<Record<StandardKey, FeatureSetting>>;
  /** Your own features for this project, added after the standard ones. */
  extra?: ExtraFeature[];
  included?: SceneGroupInput[];
  tags?: string[];
}

/* ---------- Default feature library ---------- */

type FeaturedKey = 'motionbro' | 'autoResize' | 'elements' | 'durationControl' | 'freeUpdates' | 'lifetimeLicense' | 'support';
type StandardKey = 'app' | 'controlsPanel' | 'autoTextResize' | 'videoTutorial' | 'freeFonts' | 'expressions' | 'structure';

type App = 'after-effects' | 'premiere-pro';
const APP_NAME: Record<App, string> = { 'after-effects': 'After Effects', 'premiere-pro': 'Premiere Pro' };

/** The order here is the order of the tiles; it is tuned so the tiles fill the grid without gaps. */
function featuredDefaults(app: App, elements: string): Record<FeaturedKey, Omit<Feature, 'key'>> {
  return {
    motionbro: {
      size: 'lg', tone: 'ember', icon: 'motionbro', tag: 'MotionBro',
      title: 'Works with MotionBro',
      text: 'Every scene is packed for MotionBro — browse, preview and drop it into your project in one click.',
    },
    autoResize: {
      size: 'md', tone: 'ice', icon: 'resize', visual: 'resize', tag: 'Any format',
      title: 'Auto-resize',
      text: `Scenes adapt to the size of your ${app === 'premiere-pro' ? 'sequence' : 'composition'} — 16:9, 9:16, 1:1 or 4K.`,
    },
    elements: {
      size: 'md', tone: 'ember', visual: 'stat', value: elements, tag: 'Content',
      title: 'ready-made elements',
    },
    durationControl: {
      size: 'lg', tone: 'lime', icon: 'timeline', visual: 'timeline', tag: 'Timing',
      title: 'Duration control',
      text: 'Drag the end of the layer on the timeline — the animation re-times itself automatically.',
    },
    freeUpdates: { size: 'sm', icon: 'refresh', tag: 'Updates', title: 'Free updates', text: 'New scenes at no extra cost' },
    lifetimeLicense: { size: 'sm', icon: 'infinity', tag: 'License', title: 'Lifetime license', text: 'Buy once, use forever' },
    support: { size: 'sm', icon: 'support', tag: 'Support', title: 'Author support', text: 'Help with any question' },
  };
}

function standardDefaults(app: App): Record<StandardKey, Omit<Feature, 'key'>> {
  const name = APP_NAME[app];
  return {
    app: {
      size: 'lg', tone: app === 'premiere-pro' ? 'orchid' : 'ice', icon: app, visual: 'app', value: '2024+', tag: 'Compatibility',
      title: name,
      text: `Built and tested in ${name} 2024 and newer versions.`,
    },
    controlsPanel: {
      size: 'md', tone: 'steel', icon: 'sliders', visual: 'sliders', tag: 'Customization',
      title: 'Controls panel',
      text: 'Main settings are gathered in one place for quick customization.',
    },
    autoTextResize: {
      size: 'md', tone: 'ice', icon: 'textbox', visual: 'textbox', tag: 'Typography',
      title: 'Auto text-boxes',
      text: 'Change the text — the frame stretches to fit it. Driven by scripts.',
    },
    videoTutorial: {
      size: 'md', tone: 'ember', icon: 'play', tag: 'Tutorial',
      title: 'Video tutorial included',
      text: 'A walkthrough from opening the project to the final render.',
    },
    freeFonts: { size: 'sm', icon: 'font', tag: 'Fonts', title: 'Free fonts', text: 'Download links inside the project' },
    expressions: { size: 'sm', icon: 'code', tag: 'Expressions', title: 'Universal expressions', text: 'No errors in any language version' },
    structure: { size: 'sm', icon: 'feather', tag: 'Performance', title: 'Light & well organized', text: 'Lightweight effects, no heavy files' },
  };
}

function resolve<K extends string>(defaults: Record<K, Omit<Feature, 'key'>>, settings: Partial<Record<K, FeatureSetting>> = {}): Feature[] {
  const out: Feature[] = [];
  for (const key of Object.keys(defaults) as K[]) {
    const s = settings[key];
    if (s === false) continue;
    const base = defaults[key];
    if (typeof s === 'string') out.push({ ...base, key, value: s });
    else if (s && typeof s === 'object') out.push({ ...base, ...s, key });
    else out.push({ ...base, key });
  }
  return out;
}

/* ---------- Mock data for projects without a details file ---------- */

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;

const GROUPS = [
  'Typography', 'YouTube scenes', 'Kinetic titles', 'Standard titles', 'Lower thirds',
  'Transitions', 'Call-outs', 'Backgrounds', 'Social media', 'Logo reveals',
];

function mockIncluded(p: Product): SceneGroup[] {
  const h = hash(p.slug);
  const groups = p.tier === 'basic' ? 1 : 4 + (h % 3);
  const start = h % GROUPS.length;
  const total = p.itemsCount ?? (p.tier === 'featured' ? 160 + (h % 9) * 20 : 8 + (h % 12));
  return Array.from({ length: groups }, (_, i) => {
    const title = groups === 1 ? 'Scenes' : GROUPS[(start + i * 3) % GROUPS.length];
    const share = groups === 1 ? total : Math.max(8, Math.round((total / groups) * (0.6 + ((h >> (i * 3)) % 9) / 10)));
    return { title, count: share, images: [] };
  });
}

function mockSummary(p: Product, app?: App) {
  if (!app) return p.description;
  const what = p.tier === 'pack' ? 'pack' : 'project';
  return `${p.title} is a ${what} for ${APP_NAME[app]} made for editors who need a polished result fast. Swap the text, drop in your media and pick colours from one panel — every scene is already timed and animated. Works for YouTube, social media, promos and presentations.`;
}

/* ---------- Loading ---------- */

const FILES = import.meta.glob<DetailsFile>('./details/*.json', { eager: true, import: 'default' });
const BY_SLUG: Record<string, DetailsFile> = Object.fromEntries(
  Object.entries(FILES).map(([path, data]) => [path.replace(/^.*\/|\.json$/g, ''), data]),
);

const pad = (n: number, width: number) => String(n).padStart(width, '0');

function sceneGroup(g: SceneGroupInput): SceneGroup {
  let images = g.images ?? [];
  if (!images.length && g.folder && g.count) {
    const width = Math.max(2, String(g.count).length);
    const folder = g.folder.replace(/\/$/, '');
    images = Array.from({ length: g.count }, (_, i) => `${folder}/${pad(i + 1, width)}.${g.ext ?? 'jpg'}`);
  }
  return { title: g.title, count: g.count ?? images.length, images };
}

const roundDown = (n: number) => (n >= 100 ? `${Math.floor(n / 50) * 50}+` : `${n}`);

export function getDetails(p: Product): ProjectDetails {
  const file = BY_SLUG[p.slug] ?? {};
  const app: App | undefined =
    file.application ?? (p.category === 'after-effects' || p.category === 'premiere-pro' ? p.category : undefined);

  const included = file.included ? file.included.map(sceneGroup) : app ? mockIncluded(p) : [];
  const total = included.reduce((n, g) => n + g.count, 0);

  const features: Feature[] = [];
  if (app) {
    const standard = resolve(standardDefaults(app), file.standard);
    const showFeatured = file.showFeatured ?? p.tier === 'featured';
    const featured = showFeatured ? resolve(featuredDefaults(app, roundDown(p.itemsCount ?? total)), file.featured) : [];
    // app tile first, then the featured block, then the rest of the standard features.
    const [first, ...rest] = standard[0]?.key === 'app' ? standard : [undefined, ...standard];
    if (first) features.push(first);
    features.push(...featured, ...rest.filter((f): f is Feature => !!f));
  }
  for (const [i, x] of (file.extra ?? []).entries()) {
    features.push({ key: `extra-${i}`, size: (x.size ?? 'md') as FeatureSize, tone: x.tone as FeatureTone | undefined, ...x });
  }

  return {
    summary: file.summary ?? mockSummary(p, app),
    features,
    included,
    tags: file.tags ?? p.tags,
  };
}
