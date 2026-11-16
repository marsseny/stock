/**
 * Paid-delivery mapping between catalog products, Whop plans and files in the private R2 bucket.
 *
 * This module is intentionally dependency-free (no Vite-only imports such as `?raw` or
 * `import.meta.glob`) so it can be shared by the browser bundle (`src/data/products.ts`)
 * and by the platform-independent server code in `src/server/`.
 */

export interface WhopPlanBinding {
  /** Product slug in the catalog (`/item/:slug`). */
  slug: string;
  /** Whop plan id, e.g. `plan_XXXXXXXX`. */
  whopPlanId: string;
  /** Hosted Whop checkout page for this plan. */
  whopCheckoutUrl?: string;
  /** Object key of the ZIP archive in the private R2 bucket. */
  r2FileKey: string;
}

export const WHOP_PLANS: WhopPlanBinding[] = [
  {
    slug: 'phone-20-pro-mockups',
    whopPlanId: 'plan_GwwmzzesN3k0d',
    whopCheckoutUrl: 'https://whop.com/checkout/plan_GwwmzzesN3k0d',
    r2FileKey: 'phone-20-pro-mockups.zip',
  },
];

export const planBySlug = (slug: string): WhopPlanBinding | undefined => WHOP_PLANS.find((p) => p.slug === slug);

export const planByWhopId = (whopPlanId: string): WhopPlanBinding | undefined =>
  WHOP_PLANS.find((p) => p.whopPlanId === whopPlanId);
