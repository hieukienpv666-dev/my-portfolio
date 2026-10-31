import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Clouds } from "./Clouds";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setTransitioning(true);
    window.scrollTo({ top: 0, behavior: "instant" });

    const timer = window.setTimeout(() => setTransitioning(false), 650);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="shell">
      <Clouds />
      <div className="hills" aria-hidden="true" />
      <Navbar />
      <main className={transitioning ? "page route-transition" : "page"}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
