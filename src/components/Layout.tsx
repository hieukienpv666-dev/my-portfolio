import { Ambient } from "./Ambient";
import { Clouds } from "./Clouds";
import { CloudTransition } from "./CloudTransition";
import { Footer } from "./Footer";
import { InteractionEffects } from "./InteractionEffects";
import { Navbar } from "./Navbar";
import { TabTitle, WhimsicalMascot } from "./WhimsicalDetails";

export function Layout() {
  return (
    <div className="shell">
      <Clouds />
      <Ambient />
      <div className="hills" aria-hidden="true" />
      <Navbar />
      <CloudTransition />
      <InteractionEffects />
      <WhimsicalMascot />
      <TabTitle />
      <Footer />
    </div>
  );
}
