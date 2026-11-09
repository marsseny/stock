# Framehaus

Marketplace for After Effects / Premiere Pro templates, plugins, presets and packs.

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build
```

## Structure

- `src/types.ts` — domain model (`Product`, `Tier` = `basic | featured | pack`, categories).
- `src/data/` — categories and the mock catalog (`products.ts`, deterministic generator, 84 items). Replace with an API later; pages only use the helpers exported there.
- `src/store/cart.tsx` — cart context persisted to `localStorage`.
- `src/components/VideoPreview.tsx` — preview player. Set `preview.video` (and optional `preview.poster`) on a product to use a real video; otherwise an animated placeholder is rendered. Plays on hover.
- `src/pages/` — Home (hero, featured, full catalog), Browse (`/browse?cat=&type=&tag=&q=&sort=`), Product (`/item/:slug`), About.
