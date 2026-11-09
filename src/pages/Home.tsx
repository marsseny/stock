import { Catalog } from '../components/Catalog';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FEATURED, PRODUCTS } from '../data/products';

const HERO_FEATURED = FEATURED.slice(0, 5);
const HERO_IDS = HERO_FEATURED.map((p) => p.id);

export function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          Templates that make your edit <em>move.</em>
        </h1>
        <p className="hero__lead muted">
          {PRODUCTS.length} projects, packs and plugins for After Effects, Premiere Pro & more. Buy once, use forever.
        </p>
      </section>

      <FeaturedCarousel products={HERO_FEATURED} />

      <section className="section section--catalog">
        <Catalog excludeIds={HERO_IDS} />
      </section>
    </>
  );
}
