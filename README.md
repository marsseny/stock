# Framehaus — Premium Video Templates

Marketplace for motion-design templates: After Effects / Premiere Pro / DaVinci Resolve projects, plugins, presets, sound FX and big packs.

**Stack:** React 19, React Router 7, Vite, TypeScript, plain CSS · Whop embedded checkout · Supabase (purchases, license keys, e-mail OTP sign-in) · private Cloudflare R2 (ZIP delivery). Hosted on Cloudflare Pages: static SPA + `/api/*` via `dist/_worker.js` (built from `cf/worker.ts`).

```bash
npm install          # or pnpm install
cp .env.example .env # fill in the VITE_ values
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
```

## Structure

- `src/types.ts` — domain model (`Product`, `Tier` = `basic | featured | pack`, categories).
- `src/data/` — categories and the mock catalog (`products.ts`, deterministic generator, 84 items). Pages only use the helpers exported there.
- No cart: every product is bought on its own with **Buy now · $XX** (`src/components/BuyNowButton.tsx`), because the embedded Whop checkout pays for one plan at a time.
- `src/components/CheckoutModal.tsx` — the whole purchase in one modal: `details` (e-mail or Google + promo code, no account needed) → `pay` (embedded Whop form, e-mail locked, `skipRedirect`; skipped for a 100% promo) → `verifying` (POST `/claim-download`, retried while Whop finalises the payment) → `ready` (license key with Copy, Download ZIP, next promo offer, link to My Purchases). An `error` state offers *Try again* / *My Purchases*.
- **Buyer account first:** if the visitor is not signed in, the checkout modal starts with *Create your account* — **Continue with Google** or e-mail + 6-digit code (`src/components/AuthForm.tsx`, shared with `/account`). After Google returns, the same checkout re-opens automatically (`fh_pending_checkout` in sessionStorage). Purchases are linked to the account e-mail (the Bearer token is sent to `/claim-download`).
- `src/lib/promo.ts` — progressive promo codes: `NEXT15` (15% off the 2nd product), `VIP20` (20% off the 3rd and later), plus the test code **`TEST100`** (100% off: Whop is skipped, the file is issued by `/api/claim-free`, which checks the code on the server; disable with `FREE_PROMO_DISABLED=true`). An invalid code shows only “… is not a valid promo code.” — existing codes are never hinted. The product page has a promo field that recalculates the price (strike-through + `-15%`/`-20%` badge); **Buy now** copies the code to the clipboard and pre-fills it in the Whop form, and the modal shows a "Promo code copied" banner. The code unlocked after a purchase is saved in `localStorage` (`fh_active_promo`) and auto-applied next time. **The same codes must exist in the Whop dashboard** — Whop applies the actual discount.
- `src/pages/Account.tsx` (`/account`, header button **My Account**) — passwordless sign-in by **magic link** (e-mail → link in the inbox → back to `/account`, signed in). After sign-in: a welcome block thanking the customer, the loyalty promo banner (**only after at least one paid purchase** — free files issued with `TEST100` don't count), the list of purchases (link to the product, license key, **Download ZIP**, 5 stars → short review), Log out.
- `src/components/VideoPreview.tsx` — preview player. Set `preview.video` (and `preview.poster`) on a product to use a real video; otherwise an animated placeholder is rendered. Cards play on hover; the product page autoplays with full controls (play/pause, scrubbable timeline, time, sound).
- `src/store/sound.ts` — site-wide sound preference: turning sound on/off in any preview applies to every other preview and page for the rest of the visit.
- `src/data/product-specs.csv` — per-project rows of the spec table on the product page (`slug,label,value`, one row per line). Template: `docs/specs-template.csv`.
- **Reviews:** in My Purchases every project has 5 stars (`src/components/RateProject.tsx`); clicking a star opens a short comment field, *Post review* saves it through `POST /api/reviews` (one review per buyer and project, editable). The product page loads them with `useProductReviews` and shows them first with a *Verified buyer* label; rating and count include them. `src/data/reviews.ts` still provides mock reviews after the real ones.
- `src/data/reviews.ts` + `src/components/Reviews.tsx` — review panel. Clicking the rating line in the buy box opens a reviews panel below it; "Read all" opens a dialog with every review.
- `src/pages/` — Home (hero, featured, full catalog), Browse (`/browse?cat=&type=&tag=&q=&sort=`), Product (`/item/:slug`), Account (`/account`), About.
- `docs/CONTENT-GUIDE.md` — how to prepare posters, preview videos, product data and download files (in Russian). Data templates: `docs/product-template.json`, `docs/products-template.csv`.

## Payments, licenses & downloads (backend)

Platform-independent: all server code lives in `src/server/` and exposes standard Web `(req: Request) => Promise<Response>` handlers. On Cloudflare Pages `cf/worker.ts` (bundled into `dist/_worker.js` by `npm run build`) calls `setServerEnv(env)` and dispatches to `routes` from `src/server/index.ts`. Deploy: `npm run deploy` (wrangler) or connect the repo in Pages — **build command `npm run build`, output directory `dist` are required**. Whop webhook URL: `https://<domain>/api/whop-webhook`.

| Route | Purpose |
|---|---|
| `POST /api/claim-download` `{ receiptId, planId, productSlug }` | Verifies the Whop payment, stores the purchase idempotently, returns `{ downloadUrl, licenseKey, email, fileName, totalPurchasesCount, nextPromoCode, nextDiscountPercent }` |
| `POST /api/whop-webhook` | `payment.succeeded` → idempotent insert into `purchases` (signature checked with `WHOP_WEBHOOK_SECRET`) |
| `GET /api/get-download-url?purchaseId=` + `Authorization: Bearer <supabase token>` | Fresh presigned R2 link for the signed-in owner |
| `POST /api/claim-free` `{ productSlug, promoCode }` + Bearer | 100%-off code (`TEST100`): records the purchase without Whop, same response as `claim-download` |
| `GET /api/public-config` | Public runtime config for the browser: `{ supabaseUrl, supabaseAnonKey }` (never the service key) |
| `GET /api/reviews?slug=` | Public reviews of a product (no e-mails) |
| `GET /api/reviews?mine=1` + Bearer | Reviews of the signed-in buyer |
| `POST /api/reviews` `{ productSlug, rating, comment }` + Bearer | Create/update own review (only for purchased products) |

- Database: run `supabase/schema.sql` once in Supabase → SQL Editor (tables `purchases` and `reviews`, `generate_license_key()` → `FH-XXXX-XXXX-XXXX`, RLS). The script is idempotent — run it again after updating to create `reviews`.
- **Google sign-in:** Supabase → Authentication → Providers → Google: enable and paste the Google OAuth Client ID/Secret (Google Cloud Console → Credentials → OAuth client, authorized redirect URI `https://<project>.supabase.co/auth/v1/callback`). Supabase → Authentication → URL Configuration: add the site URL and `https://<your-domain>/**` to Redirect URLs.
- Product ↔ Whop plan ↔ R2 file bindings: `src/data/whopPlans.ts` (shared by the storefront and the server).
- Frontend helpers: `src/lib/supabase.ts` (browser client), `src/lib/api.ts` (typed calls to `/api/*`, base URL `VITE_API_BASE_URL`).
- Supabase Auth → Email templates → *Magic Link*: must contain the link `{{ .ConfirmationURL }}` (the default template does). Supabase → Authentication → URL Configuration: **Site URL** = your production domain; **Redirect URLs** must include `https://<your-domain>/account` (or `https://<your-domain>/**`) and, for preview deploys, e.g. `https://*.<project>.pages.dev/**`. Otherwise Supabase sends the buyer to the Site URL instead of `/account`.
- **Supabase public config at runtime:** the browser needs the Supabase URL + anon (publishable) key. They are taken from build-time `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` if present, otherwise from `GET /api/public-config`, which reads the server variables `SUPABASE_URL` + `SUPABASE_ANON_KEY`. So it is enough to set `SUPABASE_ANON_KEY` next to the other server secrets.
- Environment: see `.env.example`. Secrets are set in the hosting dashboard, never committed. Without `WHOP_API_KEY`, claims are accepted unverified only on `localhost` or with `ALLOW_TEST_CLAIMS=true`.

## Why My Account did not work (fixed)

The deployed bundle had no `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (there was no `public.env` and the build environment had no VITE_ variables), so the browser Supabase client was `null` and `/account` always showed “My Account is not available yet” — no e-mail form, no sign-in link. The server `/api/*` routes were configured and working. Fix: the browser now falls back to `GET /api/public-config` at runtime (set `SUPABASE_ANON_KEY` on the server). Also: expired/used magic links now show a clear message, the welcome block was added, and the loyalty promo is offered only after a paid purchase (server `nextPromoFor` counts paid purchases only, so `/claim-free` returns no code for a first free file).

## Why “This checkout is no longer available” appeared

That message is rendered by Whop inside the embedded checkout when the plan id no longer accepts payments (archived/deleted plan, sold out, or hidden). The old plan `plan_ARcwJ3HFxRxRc` was in that state; the product now uses `plan_GwwmzzesN3k0d`. If the message comes back, check in Whop that the plan is active, visible and has stock, and that `NEXT15` / `VIP20` are attached to the new plan.

## Roadmap

1. Replace the mock generator with a real catalog (JSON per product, following `docs/product-template.json`).
2. Host preview videos on a CDN (Bunny.net Storage or Cloudflare R2) and posters under `public/media/<slug>/`.
3. Reviews from verified buyers are live; remove the mock generator in `src/data/reviews.ts` once enough real reviews exist.
4. Bind Whop plans for the remaining catalog items in `src/data/whopPlans.ts` (items without a plan show *Coming soon*).
5. Create the `NEXT15` / `VIP20` promo codes in Whop for every plan.
