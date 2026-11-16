import { useSearchParams } from 'react-router-dom';
import { Catalog } from '../components/Catalog';
import { categoryById, isCategoryId } from '../data/categories';

const TYPE_TITLES: Record<string, { title: string; text: string }> = {
  featured: { title: 'Featured', text: 'The best of the marketplace, picked by our team.' },
  pack: { title: 'Big packs', text: 'Hundreds of elements in a single download — the best value per project.' },
  basic: { title: 'Single projects', text: 'Focused, affordable templates for one job done right.' },
};

export function Browse() {
  const [params] = useSearchParams();
  const cat = params.get('cat');
  const type = params.get('type');
  const q = params.get('q');

  let title = 'All templates';
  let text = 'Browse the full catalog of templates, plugins and packs.';
  if (isCategoryId(cat)) {
    title = categoryById(cat).label;
    text = categoryById(cat).description;
  } else if (type && TYPE_TITLES[type]) {
    ({ title, text } = TYPE_TITLES[type]);
  } else if (q) {
    title = 'Search';
    text = 'Results across all applications.';
  }

  return (
    <section className="section section--page">
      <div className="page-head">
        <h1>{title}</h1>
        <p className="muted">{text}</p>
      </div>
      <Catalog />
    </section>
  );
}
