import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
// Created at startup so the e-mail sign-in link tokens in the URL are consumed early.
import './lib/supabase';
import { About } from './pages/About';
import { Account } from './pages/Account';
import { BecomeAuthor } from './pages/BecomeAuthor';
import { Browse } from './pages/Browse';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ProductPage } from './pages/ProductPage';

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith('/item/')) document.title = 'Nuova Motion — Templates for After Effects, Premiere Pro & more';
  }, [pathname]);

  return (
    <>
      <div className="backdrop" aria-hidden>
        <div className="backdrop__art" />
        <div className="backdrop__shape backdrop__shape--haze" />
        <div className="backdrop__shape backdrop__shape--glow" />
        <div className="backdrop__grain" />
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
