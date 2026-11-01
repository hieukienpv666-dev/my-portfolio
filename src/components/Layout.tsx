import { Clouds } from "./Clouds";
import { CloudTransition } from "./CloudTransition";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="shell">
      <Clouds />
      <div className="hills" aria-hidden="true" />
      <Navbar />
      <CloudTransition />
      <Footer />
    </div>
  );
}
