import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryById } from '../data/categories';
import { formatPrice } from '../data/products';
import { useCart } from '../store/cart';
import { Close } from './Icons';
import { VideoPreview } from './VideoPreview';

export function CartDrawer() {
  const cart = useCart();

  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cart.close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart]);

  return (
    <div className={`drawer ${cart.isOpen ? 'is-open' : ''}`} aria-hidden={!cart.isOpen}>
      <div className="drawer__scrim" onClick={cart.close} />
      <aside className="drawer__panel glass-panel" role="dialog" aria-label="Cart">
        <div className="drawer__head">
          <h2>Your cart</h2>
          <button className="btn btn--glass btn--icon" onClick={cart.close} aria-label="Close cart">
            <Close />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="drawer__empty">
            <p>Your cart is empty.</p>
            <button className="btn btn--glass" onClick={cart.close}>
              Keep browsing
            </button>
          </div>
        ) : (
          <>
            <ul className="drawer__list">
              {cart.items.map((p) => (
                <li key={p.id} className="drawer__item">
                  <Link to={`/item/${p.slug}`} onClick={cart.close} className="drawer__thumb">
                    <VideoPreview product={p} playing={false} showPlayIcon={false} />
                  </Link>
                  <div className="drawer__info">
                    <Link to={`/item/${p.slug}`} onClick={cart.close}>
                      {p.title}
                    </Link>
                    <small>
                      {categoryById(p.category).label}
                      {p.tier === 'pack' && ` · ${p.itemsCount} items`}
                    </small>
                    <button className="link-btn" onClick={() => cart.remove(p.id)}>
                      Remove
                    </button>
                  </div>
                  <strong>{formatPrice(p.price)}</strong>
                </li>
              ))}
            </ul>
            <div className="drawer__foot">
              <div className="drawer__total">
                <span>Total</span>
                <strong>{formatPrice(cart.total)}</strong>
              </div>
              <button className="btn btn--glass btn--lg btn--block" onClick={() => alert('Checkout is not connected yet.')}>
                Checkout
              </button>
              <small className="muted">Lifetime license · instant download</small>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
