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
  sales: number;
  rating: number;
  description: string;
  preview: PreviewMedia;
}
