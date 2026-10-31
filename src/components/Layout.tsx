import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Clouds } from "./Clouds";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="shell">
      <Clouds />
      <div className="hills" aria-hidden="true" />
      <Navbar />
      <main key={location.pathname} className="page route-transition">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
