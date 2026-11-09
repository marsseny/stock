import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PRODUCTS } from '../data/products';
import type { Product } from '../types';

interface CartState {
  items: Product[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (p: Product) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartState | null>(null);
const KEY = 'framehaus.cart';

// Digital goods: each item can be in the cart at most once, so we store ids only.
function load(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((id) => PRODUCTS.some((p) => p.id === id)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(load);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(ids)), [ids]);

  const add = useCallback((p: Product) => {
    setIds((cur) => (cur.includes(p.id) ? cur : [...cur, p.id]));
    setOpen(true);
  }, []);

  const value = useMemo<CartState>(() => {
    const items = ids.map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean);
    return {
      items,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      remove: (id) => setIds((cur) => cur.filter((x) => x !== id)),
      has: (id) => ids.includes(id),
      clear: () => setIds([]),
      total: items.reduce((s, p) => s + p.price, 0),
    };
  }, [ids, isOpen, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
