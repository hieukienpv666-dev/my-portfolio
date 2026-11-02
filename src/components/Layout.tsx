import { Ambient } from "./Ambient";
import { Clouds } from "./Clouds";
import { CloudTransition } from "./CloudTransition";
import { Footer } from "./Footer";
import { InteractionEffects } from "./InteractionEffects";
import { Navbar } from "./Navbar";
import { SootLights } from "./SootLights";
import { NightSky, TabTitle, WhimsicalMascot } from "./WhimsicalDetails";

export function Layout() {
  return (
    <div className="shell">
      <NightSky />
      <Clouds />
      <Ambient />
      <SootLights />
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
