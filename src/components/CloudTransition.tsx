import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";

type TransitionPhase = "idle" | "covering" | "revealing";

const COVER_DURATION_MS = 800;
const REVEAL_DURATION_MS = 800;

const cloudLayers = [
  { id: "cloud-a", direction: "from-left", depth: "back", size: 44, top: -8, left: -9, rotation: "-5deg", flip: false, delay: 0 },
  { id: "cloud-b", direction: "from-right", depth: "middle", size: 52, top: 0, right: -14, rotation: "4deg", flip: true, delay: 80 },
  { id: "cloud-c", direction: "from-right", depth: "front", size: 66, top: -14, right: 12, rotation: "-2deg", flip: false, delay: 170 },
  { id: "cloud-d", direction: "from-bottom", depth: "back", size: 40, top: 20, left: 8, rotation: "3deg", flip: true, delay: 55 },
  { id: "cloud-e", direction: "from-left", depth: "middle", size: 58, top: 18, left: -11, rotation: "-3deg", flip: false, delay: 120 },
  { id: "cloud-f", direction: "from-left", depth: "front", size: 70, top: 14, left: 27, rotation: "2deg", flip: true, delay: 205 },
  { id: "cloud-g", direction: "from-right", depth: "back", size: 46, top: 38, right: -8, rotation: "5deg", flip: false, delay: 75 },
  { id: "cloud-h", direction: "from-bottom", depth: "middle", size: 56, top: 34, left: 22, rotation: "-4deg", flip: true, delay: 145 },
  { id: "cloud-i", direction: "from-right", depth: "front", size: 68, top: 37, right: -12, rotation: "3deg", flip: false, delay: 225 },
  { id: "cloud-j", direction: "from-left", depth: "middle", size: 50, top: 58, left: -7, rotation: "4deg", flip: true, delay: 180 },
  { id: "cloud-k", direction: "from-bottom", depth: "front", size: 64, top: 59, left: 12, rotation: "-2deg", flip: false, delay: 250 },
  { id: "cloud-l", direction: "from-right", depth: "front", size: 54, top: 68, right: -4, rotation: "5deg", flip: true, delay: 240 },
] as const;

function CloudPuff(cloud: (typeof cloudLayers)[number]) {
  const flip = cloud.flip ? "-1" : "1";
  const enterX = cloud.direction === "from-left"
    ? "-120vw"
    : cloud.direction === "from-right"
      ? "120vw"
      : "0";
  const enterY = cloud.direction === "from-bottom" ? "120vh" : "0";
  const exitX = cloud.direction === "from-left"
    ? "-120vw"
    : cloud.direction === "from-right"
      ? "120vw"
      : "0";
  const exitY = cloud.direction === "from-bottom" ? "-120vh" : "0";

  return (
    <img
      className={[
        "cloud-puff",
        cloud.id,
        `cloud-${cloud.direction}`,
        `cloud-${cloud.depth}`,
        cloud.flip ? "is-flipped" : "",
      ].filter(Boolean).join(" ")}
      src="/cloud-ghibli.png"
      alt=""
      draggable={false}
      style={{
        width: `${cloud.size}vw`,
        top: `${cloud.top}%`,
        left: "left" in cloud ? `${cloud.left}%` : undefined,
        right: "right" in cloud ? `${cloud.right}%` : undefined,
        "--cloud-rotation": cloud.rotation,
        "--cloud-flip": flip,
        "--cloud-delay": `${cloud.delay}ms`,
        "--cloud-enter-x": enterX,
        "--cloud-enter-y": enterY,
        "--cloud-exit-x": exitX,
        "--cloud-exit-y": exitY,
      } as CSSProperties & Record<`--${string}`, string>}
    />
  );
}

export function CloudTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [displayedOutlet, setDisplayedOutlet] = useState(outlet);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const latestOutlet = useRef(outlet);
  const observedPathname = useRef(location.pathname);
  const phaseRef = useRef(phase);

  latestOutlet.current = outlet;
  phaseRef.current = phase;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useLayoutEffect(() => {
    if (observedPathname.current === location.pathname) return;

    observedPathname.current = location.pathname;
    if (reducedMotion) {
      setDisplayedOutlet(outlet);
      setPhase("idle");
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    if (phaseRef.current !== "covering") setPhase("covering");
  }, [location.pathname, outlet, reducedMotion]);

  useEffect(() => {
    if (!reducedMotion || phase === "idle") return;

    setDisplayedOutlet(latestOutlet.current);
    setPhase("idle");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase === "idle") return;

    const duration = phase === "covering" ? COVER_DURATION_MS : REVEAL_DURATION_MS;
    const timeout = window.setTimeout(() => {
      if (phase === "covering") {
        setDisplayedOutlet(latestOutlet.current);
        window.scrollTo({ top: 0, behavior: "instant" });
        setPhase("revealing");
      } else {
        setPhase("idle");
      }
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [phase]);

  return (
    <>
      <main className="page route-transition">
        {displayedOutlet}
      </main>
      <div
        className={`cloud-transition${phase === "idle" ? "" : ` is-${phase}`}`}
        aria-hidden="true"
      >
        <div className="cloud-rear-fill" />
        {cloudLayers.map((cloud) => (
          <CloudPuff key={cloud.id} {...cloud} />
        ))}
      </div>
    </>
  );
}
