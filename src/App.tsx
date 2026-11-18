import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { readPendingCheckout } from './lib/pendingCheckout';
import { loadSupabase } from './lib/supabase';
import { About } from './pages/About';
import { Account } from './pages/Account';
import { BecomeAuthor } from './pages/BecomeAuthor';
import { Browse } from './pages/Browse';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ProductPage } from './pages/ProductPage';

/**
 * After "Continue with Google" Supabase may land the buyer on the Site URL (home) instead of the product
 * page (when that page is not in the allowed Redirect URLs). On the first load, if a checkout is pending
 * for another page, wait until the sign-in tokens in the URL are consumed, then go back to that page —
 * `BuyNowButton` there re-opens the checkout.
 */
function useResumePendingCheckout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    const pending = readPendingCheckout();
    if (!pending || pending.path === pathname) return;
    let active = true;
    void loadSupabase()
      .then((sb) => sb?.auth.getSession())
      .catch(() => undefined)
      .then(() => {
        const still = readPendingCheckout();
        if (active && still) navigate(still.path, { replace: true });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first page load only
  }, []);
}

function Layout() {
  useResumePendingCheckout();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith('/item/')) document.title = 'Nuovo Motion — Templates for After Effects, Premiere Pro & more';
  }, [pathname]);

  return (
    <>
      <div className="backdrop" aria-hidden>
        <div className="backdrop__shape backdrop__shape--ring" />
        <div className="backdrop__shape backdrop__shape--loop" />
        <div className="backdrop__shape backdrop__shape--orb" />
        <div className="backdrop__vignette" />
      </div>
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="browse" element={<Browse />} />
        <Route path="item/:slug" element={<ProductPage />} />
        <Route path="about" element={<About />} />
        <Route path="become-author" element={<BecomeAuthor />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
