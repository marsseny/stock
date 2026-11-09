import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { About } from './pages/About';
import { Browse } from './pages/Browse';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ProductPage } from './pages/ProductPage';

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith('/item/')) document.title = 'Framehaus — Templates for After Effects, Premiere Pro & more';
  }, [pathname]);

  return (
    <>
      <div className="backdrop" aria-hidden />
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
