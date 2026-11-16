export type Tier = 'basic' | 'featured' | 'pack';

export type CategoryId =
  | 'after-effects'
  | 'premiere-pro'
  | 'plugins'
  | 'davinci-resolve'
  | 'presets'
  | 'sound-fx';

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  description: string;
}

export interface PreviewMedia {
  /** Real preview video URL. When absent, an animated placeholder is shown. */
  video?: string;
  poster?: string;
  /** Placeholder palette & layout. */
  hueA: number;
  hueB: number;
  variant: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: CategoryId;
  tier: Tier;
  tags: string[];
  price: number;
  oldPrice?: number;
  /** Packs only: number of included items. */
  itemsCount?: number;
  /** Packs only: names of a few included items. */
  includes?: string[];
  resolution: string;
  duration?: string;
  compatibility: string;
  fileSize: string;
  pluginsRequired: boolean;
  createdAt: string;
  /** Used for "popular" sorting only; not shown on the site. */
  sales: number;
  rating: number;
  reviewsCount: number;
  /**
   * Rows of the spec table on the product page, in display order.
   * Filled per project in `src/data/product-specs.csv`; when a project has no rows there,
   * the default rows (Application, Resolution, Duration, …) are built from the fields above.
   */
  specs?: Spec[];
  description: string;
  preview: PreviewMedia;
  /** Whop plan used to sell this product. Empty string — the product is not purchasable yet. */
  whopPlanId: string;
  /** Hosted Whop checkout page for `whopPlanId`. */
  whopCheckoutUrl?: string;
  /** Object key of the downloadable ZIP archive in the private Cloudflare R2 bucket. */
  r2FileKey: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  /** Real review from a buyer (stored in the database), not a mock. */
  verified?: boolean;
}

/* ---------- Detailed project description (product page) ---------- */

/** Visual size of a feature tile: `lg` — wide tile with icon, `md` — tile with icon, `sm` — small text pill. */
export type FeatureSize = 'lg' | 'md' | 'sm';
/** Glow colour of a tile. */
export type FeatureTone = 'ember' | 'lime' | 'ice' | 'orchid' | 'steel';

export interface Feature {
  key: string;
  title: string;
  text?: string;
  icon?: string;
  size: FeatureSize;
  tone?: FeatureTone;
  /** Optional decoration drawn inside the tile (see ProjectDetails). */
  visual?: 'timeline' | 'resize' | 'sliders' | 'textbox' | 'app' | 'stat';
  /** Big value for `app` (version) and `stat` (count) tiles. */
  value?: string;
}

export interface SceneGroup {
  title: string;
  /** Number shown next to the category; defaults to the number of images. */
  count: number;
  /** Image URLs of scene previews (16:9). Empty → generated placeholders. */
  images: string[];
}

export interface ProjectDetails {
  summary: string;
  features: Feature[];
  included: SceneGroup[];
  tags: string[];
}
