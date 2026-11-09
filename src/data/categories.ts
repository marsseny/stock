import type { Category, CategoryId } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'after-effects',
    label: 'After Effects',
    short: 'AE',
    description: 'Openers, titles, logo reveals and motion graphics projects for Adobe After Effects.',
  },
  {
    id: 'premiere-pro',
    label: 'Premiere Pro',
    short: 'PR',
    description: 'Drag-and-drop MOGRTs, transitions and editing presets for Adobe Premiere Pro.',
  },
  {
    id: 'plugins',
    label: 'Plugins & Scripts',
    short: 'PL',
    description: 'Extensions, scripts and tools that speed up your workflow.',
  },
  {
    id: 'davinci-resolve',
    label: 'DaVinci Resolve',
    short: 'DR',
    description: 'Fusion titles, macros and transitions for DaVinci Resolve.',
  },
  {
    id: 'presets',
    label: 'LUTs & Presets',
    short: 'LT',
    description: 'Color grading LUTs and effect presets for every NLE.',
  },
  {
    id: 'sound-fx',
    label: 'Sound FX',
    short: 'SFX',
    description: 'Whooshes, risers, hits and UI sounds designed for motion.',
  },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export const isCategoryId = (v: string | null): v is CategoryId =>
  !!v && CATEGORIES.some((c) => c.id === v);
