# Nuova Motion — Premium Video Templates

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
- No cart: every product is bought on its own with **Buy now** (the price and a "+ your country's tax" note sit next to it) (`src/components/BuyNowButton.tsx`), because the embedded Whop checkout pays for one plan at a time.
- `src/components/CheckoutModal.tsx` — the whole purchase in one modal: `details` (typed e-mail + promo code, no account needed) → `pay` (embedded Whop form, e-mail locked, `skipRedirect`; skipped for a 100% promo) → `verifying` (POST `/claim-download`, retried while Whop finalises the payment) → `ready` (license key with Copy, Download ZIP, next promo offer, link to My Purchases). An `error` state offers *Try again* / *My Purchases*.
- **No account needed:** the checkout asks only for an e-mail typed by the buyer (no Google / OAuth sign-in). Buyers already signed in to My Account (e-mail link, `src/components/AuthForm.tsx`) get their account e-mail pre-filled and the Bearer token is sent to `/claim-download`.
- `src/lib/promo.ts` — progressive promo codes: `NEXT15` (15% off the 2nd product), `VIP20` (20% off the 3rd and later), plus the test code **`TEST100`** (100% off: Whop is skipped, the file is issued by `/api/claim-free`, which checks the code on the server; disable with `FREE_PROMO_DISABLED=true`). An invalid code shows only “… is not a valid promo code.” — existing codes are never hinted. The product page and the checkout have a low-key *Have a promo code?* link (`src/components/PromoCodeField.tsx`) that opens the input; an applied code recalculates the price (strike-through + `-15%`/`-20%` badge) and is passed to Whop. **Codes are never filled in automatically** — the buyer types them; an applied code is remembered for 15 minutes (`fh_promo_applied`) and cleared after the order. The loyalty code is only shown (order screen, My Account banner). **The same codes must exist in the Whop dashboard** — Whop applies the actual discount.
- `src/pages/Account.tsx` (`/account`, header button **My Account**) — passwordless sign-in by **magic link** (e-mail → link in the inbox → back to `/account`, signed in). After sign-in: a welcome block thanking the customer, the loyalty promo banner (**only after at least one paid purchase** — free files issued with `TEST100` don't count), the list of purchases (link to the product, license key, **Download ZIP**, 5 stars → short review), Log out.
- `src/components/VideoPreview.tsx` — preview player. Set `preview.video` (and `preview.poster`) on a product to use a real video; otherwise an animated placeholder is rendered. Cards play on hover; the product page autoplays with full controls (play/pause, scrubbable timeline, time, sound).
- `src/store/sound.ts` — site-wide sound preference: turning sound on/off in any preview applies to every other preview and page for the rest of the visit.
- `src/data/product-specs.csv` — per-project rows of the spec table on the product page (`slug,label,value`, one row per line). Template: `docs/specs-template.csv`.
- **Reviews:** only real, paying buyers can rate (`POST /api/reviews` checks a paid purchase; free `TEST100` files cannot be rated). In My Account every paid purchase has 5 stars (`src/components/RateProject.tsx`), the comment is optional. The product page shows only these reviews (`useProductReviews`), all equal — no labels, no generated or automatic ratings. A new product starts with *No reviews yet*.
- `src/data/reviews.ts` + `src/components/Reviews.tsx` — review panel. Clicking the rating line in the buy box opens a reviews panel below it; "Read all" opens a dialog with every review.
- `src/pages/` — Home (split first screen: 2 top projects on the left, description / search / tags on the right; then all projects, 3 per row, details on hover), Browse (`/browse?cat=&type=&tag=&q=&sort=`), Product (`/item/:slug`), Account (`/account`), About, Become an author (`/become-author`: the core team is complete, visitors can leave an application — e-mail, portfolio, text — sent via `/api/contact` with `topic: 'author'`).
- `docs/CONTENT-GUIDE.md` — how to prepare posters, preview videos, product data and download files (in Russian). Data templates: `docs/product-template.json`, `docs/products-template.csv`.

## Payments, licenses & downloads (backend)

Platform-independent: all server code lives in `src/server/` and exposes standard Web `(req: Request) => Promise<Response>` handlers. On Cloudflare Pages `cf/worker.ts` (bundled into `dist/_worker.js` by `npm run build`) calls `setServerEnv(env)` and dispatches to `routes` from `src/server/index.ts`. Deploy: `npm run deploy` (wrangler) or connect the repo in Pages — **build command `npm run build`, output directory `dist` are required**. Whop webhook URL: `https://<domain>/api/whop-webhook`.

| Route | Purpose |
|---|---|
| `POST /api/claim-download` `{ receiptId, planId, productSlug }` | Verifies the Whop payment, stores the purchase idempotently, returns `{ downloadUrl, licenseKey, email, fileName, totalPurchasesCount, nextPromoCode, nextDiscountPercent }` |
| `POST /api/whop-webhook` | `payment.succeeded` → idempotent insert into `purchases` (signature checked with `WHOP_WEBHOOK_SECRET`) |
| `GET /api/get-download-url?purchaseId=` + `Authorization: Bearer <supabase token>` | Fresh presigned R2 link for the signed-in owner |
| `POST /api/claim-free` `{ productSlug, promoCode }` + Bearer | 100%-off code (`TEST100`): records the purchase without Whop, same response as `claim-download` |
| `GET /api/public-config` | Public runtime config for the browser: `{ supabaseUrl, supabaseAnonKey, authProxy, missing }` (never the service key) |
| `GET /api/my-purchases` | Purchases of the signed-in buyer (Bearer token) |
| `/api/sb/auth/v1/*` | Sign-in proxy, used only when no public key is set on the server (allow-listed end-user Auth endpoints) |
| `GET /api/reviews?slug=` | Public reviews of a product (no e-mails) |
| `GET /api/reviews?mine=1` + Bearer | Reviews of the signed-in buyer |
| `POST /api/reviews` `{ productSlug, rating, comment }` + Bearer | Create/update own review (only for purchased products) |

- Database: run `supabase/schema.sql` once in Supabase → SQL Editor (tables `purchases` and `reviews`, `generate_license_key()` → `FH-XXXX-XXXX-XXXX`, RLS). The script is idempotent — run it again after updating to create `reviews`.
- **Sign-in:** e-mail link only. Google sign-in is not used — you can switch the Google provider off in Supabase → Authentication → Providers. Supabase → Authentication → URL Configuration: add the site URL and `https://<your-domain>/account` to Redirect URLs.
- Product ↔ Whop plan ↔ R2 file bindings: `src/data/whopPlans.ts` (shared by the storefront and the server).
- Frontend helpers: `src/lib/supabase.ts` (browser client), `src/lib/api.ts` (typed calls to `/api/*`, base URL `VITE_API_BASE_URL`).
- Supabase Auth → Email templates → *Magic Link*: must contain the link `{{ .ConfirmationURL }}` (the default template does). Supabase → Authentication → URL Configuration: **Site URL** = your production domain; **Redirect URLs** must include `https://<your-domain>/account` (or `https://<your-domain>/**`) and, for preview deploys, e.g. `https://*.<project>.pages.dev/**`. Otherwise Supabase sends the buyer to the Site URL instead of `/account`.
- **Supabase public config at runtime:** the browser needs the Supabase URL + anon (publishable) key. They are taken from build-time `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` if present, otherwise from `GET /api/public-config`, which reads the server variables `SUPABASE_URL` + `SUPABASE_ANON_KEY`. So it is enough to set `SUPABASE_ANON_KEY` next to the other server secrets. If no public key is set at all, sign-in still works through the server proxy `/api/sb/auth/v1/*` using `SUPABASE_SERVICE_ROLE_KEY` (the key stays on the server). A secret key put into `SUPABASE_ANON_KEY` by mistake is ignored, never sent to the browser.
- Environment: see `.env.example`. Secrets are set in the hosting dashboard, never committed. Without `WHOP_API_KEY`, claims are accepted unverified only on `localhost` or with `ALLOW_TEST_CLAIMS=true`.

## Why My Account did not work (fixed)

The deployed bundle had no `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (there was no `public.env` and the build environment had no VITE_ variables), so the browser Supabase client was `null` and `/account` always showed “My Account is not available yet” — no e-mail form, no sign-in link. The server `/api/*` routes were configured and working. Fix: the browser now falls back to `GET /api/public-config` at runtime (set `SUPABASE_ANON_KEY` on the server). Also: expired/used magic links now show a clear message, the welcome block was added, and the loyalty promo is offered only after a paid purchase (server `nextPromoFor` counts paid purchases only, so `/claim-free` returns no code for a first free file).

## Why “This checkout is no longer available” appeared

That message is rendered by Whop inside the embedded checkout when the plan id no longer accepts payments (archived/deleted plan, sold out, or hidden). The old plan `plan_ARcwJ3HFxRxRc` was in that state; the product now uses `plan_GwwmzzesN3k0d`. If the message comes back, check in Whop that the plan is active, visible and has stock, and that `NEXT15` / `VIP20` are attached to the new plan.

## Roadmap

1. Replace the mock generator with a real catalog (JSON per product, following `docs/product-template.json`).
2. Host preview videos on a CDN (Bunny.net Storage or Cloudflare R2) and posters under `public/media/<slug>/`.
3. Send buyers a "rate your purchase" e-mail a few days after the order (more real reviews, honestly collected).
4. Bind Whop plans for the remaining catalog items in `src/data/whopPlans.ts` (items without a plan show *Coming soon*).
5. Create the `NEXT15` / `VIP20` promo codes in Whop for every plan.
