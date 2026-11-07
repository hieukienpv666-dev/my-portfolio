import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { CSSProperties } from "react";
import { CatMascot } from "./CatMascot";

type Theme = "light" | "dark";
type ThemeTransitionPhase =
  | "idle"
  | "anticipation"
  | "burst"
  | "fallback-burst"
  | "fallback-settle"
  | "settling";

const ANTICIPATION_DURATION_MS = 180;
const BURST_DURATION_MS = 650;
const FALLBACK_SETTLE_DURATION_MS = 150;
const PARTICLE_DURATION_MS = 700;
const SPEED_LINE_DURATION_MS = 400;
const SPEED_LINE_COUNT = 20;
const PARTICLE_COUNT = 22;

type ThemeBurst = {
  x: number;
  y: number;
  radius: number;
  toTheme: Theme;
};

type ViewTransitionHandle = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionHandle;
};

const nightStars = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 47 + 13) % 97}%`,
  top: `${(index * 61 + 9) % 91}%`,
  delay: `${-((index * 7) % 9)}s`,
  size: `${2 + (index % 3)}px`,
}));

const burstEffectNames = [
  "theme-burst-ring",
  ...Array.from({ length: SPEED_LINE_COUNT }, (_, index) => `theme-burst-line-${index}`),
  ...Array.from({ length: PARTICLE_COUNT }, (_, index) => `theme-burst-particle-${index}`),
];

function ThemeBurstLayer({
  burst,
  useViewTransitionNames,
}: {
  burst: ThemeBurst;
  useViewTransitionNames: boolean;
}) {
  const { x, y, radius, toTheme } = burst;
  const effects = useViewTransitionNames
    ? burstEffectNames.map(
        (name) =>
          `::view-transition-group(${name}) { z-index: 3; animation: none; } ::view-transition-old(${name}) { display: none; } ::view-transition-new(${name}) { animation: none; }`,
      ).join("\n")
    : "";
  const styleVars = {
    "--burst-x": `${x}px`,
    "--burst-y": `${y}px`,
    "--burst-radius": `${radius}px`,
  } as CSSProperties & Record<`--${string}`, string>;

  return (
    <div
      className={`theme-burst-layer is-to-${toTheme}${useViewTransitionNames ? " uses-view-transition" : ""}`}
      style={styleVars}
      aria-hidden="true"
    >
      {useViewTransitionNames && <style>{effects}</style>}
      <span
        className="theme-burst-ring"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          viewTransitionName: useViewTransitionNames ? "theme-burst-ring" : "none",
        }}
      />
      {Array.from({ length: SPEED_LINE_COUNT }, (_, index) => {
        const angle = (index / SPEED_LINE_COUNT) * Math.PI * 2;
        const length = radius * (0.18 + ((index * 7) % 10) / 100);
        const travel = radius * (0.38 + ((index * 13) % 45) / 100);

        return (
          <span
            className="theme-speed-line"
            key={`line-${index}`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              "--burst-angle": `${(angle * 180) / Math.PI}deg`,
              "--burst-length": `${length}px`,
              "--burst-dx": `${Math.cos(angle) * travel}px`,
              "--burst-dy": `${Math.sin(angle) * travel}px`,
              "--burst-delay": `${(index % 5) * 12}ms`,
              viewTransitionName: useViewTransitionNames
                ? `theme-burst-line-${index}`
                : "none",
            } as CSSProperties & Record<`--${string}`, string>}
          />
        );
      })}
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const angle = ((index * 137.5) % 360) * (Math.PI / 180);
        const travel = radius * (0.22 + ((index * 19) % 54) / 100);
        const rotation = (index * 73) % 360;

        return (
          <span
            className={`theme-burst-particle${toTheme === "light" && index % 3 !== 0 ? " is-petal" : ""}`}
            key={`particle-${index}`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              "--burst-dx": `${Math.cos(angle) * travel}px`,
              "--burst-dy": `${Math.sin(angle) * travel}px`,
              "--burst-rotation": `${rotation}deg`,
              "--burst-delay": `${(index % 6) * 14}ms`,
              viewTransitionName: useViewTransitionNames
                ? `theme-burst-particle-${index}`
                : "none",
            } as CSSProperties & Record<`--${string}`, string>}
          />
        );
      })}
    </div>
  );
}

function animateTransitionPseudo(
  name: string,
  keyframes: Keyframe[],
  duration: number,
  easing: string,
  delay = 0,
) {
  return document.documentElement.animate(keyframes, {
    duration,
    easing,
    delay,
    fill: "both",
    pseudoElement: `::view-transition-new(${name})`,
  } as KeyframeAnimationOptions & { pseudoElement: string });
}

function getBurstAnimations(burstDetails: ThemeBurst) {
  const { x, y, radius } = burstDetails;
  const animations = [
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: BURST_DURATION_MS,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
        pseudoElement: "::view-transition-new(root)",
      } as KeyframeAnimationOptions & { pseudoElement: string },
    ),
    animateTransitionPseudo(
      "theme-burst-ring",
      [
        { transform: "translate(-50%, -50%) scale(0.005)", opacity: 0.95 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0.85, offset: 0.72 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      720,
      "cubic-bezier(0.16, 1, 0.3, 1)",
    ),
  ];

  for (let index = 0; index < SPEED_LINE_COUNT; index += 1) {
    const angle = (index / SPEED_LINE_COUNT) * 360;
    const radians = (angle * Math.PI) / 180;
    const travel = radius * (0.38 + ((index * 13) % 45) / 100);

    animations.push(
      animateTransitionPseudo(
        `theme-burst-line-${index}`,
        [
          {
            transform: `translate(-50%, -100%) rotate(${angle}deg) scaleY(0.08)`,
            opacity: 0.95,
          },
          {
            transform: `translate(${Math.cos(radians) * travel}px, ${Math.sin(radians) * travel}px) rotate(${angle}deg) scaleY(1)`,
            opacity: 0,
          },
        ],
        SPEED_LINE_DURATION_MS,
        "cubic-bezier(0.16, 1, 0.3, 1)",
        (index % 5) * 12,
      ),
    );
  }

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const angle = ((index * 137.5) % 360) * (Math.PI / 180);
    const travel = radius * (0.22 + ((index * 19) % 54) / 100);
    const rotation = (index * 73) % 360;

    animations.push(
      animateTransitionPseudo(
        `theme-burst-particle-${index}`,
        [
          {
            transform: "translate(-50%, -50%) scale(0.18) rotate(0deg)",
            opacity: 0,
            offset: 0,
          },
          {
            transform: "translate(-50%, -50%) scale(1) rotate(0deg)",
            opacity: 1,
            offset: 0.2,
          },
          {
            transform: `translate(${Math.cos(angle) * travel}px, ${Math.sin(angle) * travel}px) scale(0.08) rotate(${rotation}deg)`,
            opacity: 0,
            offset: 1,
          },
        ],
        PARTICLE_DURATION_MS,
        "cubic-bezier(0.16, 1, 0.3, 1)",
        (index % 6) * 14,
      ),
    );
  }

  return animations;
}

export function WhimsicalMascot() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [phase, setPhase] = useState<ThemeTransitionPhase>("idle");
  const transitionLock = useRef(false);
  const timeouts = useRef<number[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [wipeOrigin, setWipeOrigin] = useState({ x: "50vw", y: "50vh" });
  const [burst, setBurst] = useState<ThemeBurst | null>(null);

  function applyTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);

    try {
      window.localStorage.setItem("portfolio-theme", nextTheme);
    } catch (error) {
      console.warn("Could not save the portfolio theme.", error);
    }
  }

  function finishTransition() {
    timeouts.current.forEach(window.clearTimeout);
    timeouts.current = [];
    document.documentElement.classList.remove("theme-anticipating");
    setPhase("idle");
    setBurst(null);
    transitionLock.current = false;
  }

  function startFallback(nextTheme: Theme, burstDetails: ThemeBurst) {
    document.documentElement.classList.remove("theme-anticipating");
    setBurst(burstDetails);
    setPhase("fallback-burst");
    timeouts.current = [
      window.setTimeout(() => {
        applyTheme(nextTheme);
        setPhase("fallback-settle");
      }, BURST_DURATION_MS),
      window.setTimeout(
        finishTransition,
        BURST_DURATION_MS + FALLBACK_SETTLE_DURATION_MS,
      ),
    ];
  }

  function runViewTransitionAnimations(
    transition: ViewTransitionHandle,
    burstDetails: ThemeBurst,
  ) {
    const animations = getBurstAnimations(burstDetails);
    timeouts.current.push(
      window.setTimeout(() => setPhase("settling"), BURST_DURATION_MS + 130),
    );

    return Promise.all([
      transition.finished,
      ...animations.map((animation) => animation.finished),
    ]);
  }

  function changeTheme() {
    if (transitionLock.current) return;
    const nextTheme: Theme = theme === "light" ? "dark" : "light";

    transitionLock.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme(nextTheme);
      transitionLock.current = false;
      return;
    }

    const bounds = buttonRef.current?.getBoundingClientRect();
    const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
    const y = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;
    const radius = Math.max(
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y),
    );
    const burstDetails = { x, y, radius, toTheme: nextTheme };

    timeouts.current.forEach(window.clearTimeout);
    document.documentElement.style.setProperty("--theme-origin-x", `${x}px`);
    document.documentElement.style.setProperty("--theme-origin-y", `${y}px`);
    document.documentElement.classList.add("theme-anticipating");
    setWipeOrigin({ x: `${x}px`, y: `${y}px` });
    setPhase("anticipation");

    timeouts.current = [
      window.setTimeout(() => {
        const startViewTransition = (document as ViewTransitionDocument).startViewTransition;

        if (!startViewTransition) {
          startFallback(nextTheme, burstDetails);
          return;
        }

        try {
          const transition = startViewTransition.call(document, () => {
            document.documentElement.classList.remove("theme-anticipating");
            flushSync(() => {
              applyTheme(nextTheme);
              setBurst(burstDetails);
              setPhase("burst");
            });
          });

          void transition.ready
            .then(() => runViewTransitionAnimations(transition, burstDetails))
            .catch((error: unknown) => {
              console.error("The theme burst transition could not complete.", error);
            })
            .finally(finishTransition);
        } catch (error) {
          console.error("The theme burst transition could not start; using the fallback.", error);
          startFallback(nextTheme, burstDetails);
        }
      }, ANTICIPATION_DURATION_MS),
    ];
  }

  useEffect(() => () => {
    timeouts.current.forEach(window.clearTimeout);
  }, []);

  return createPortal(
    <>
      {phase !== "idle" && (
        <>
          {(phase === "fallback-burst" || phase === "fallback-settle") && (
            <div
              className={`theme-transition-wipe is-${phase} is-to-${burst?.toTheme ?? theme}`}
              style={{
                "--wipe-x": wipeOrigin.x,
                "--wipe-y": wipeOrigin.y,
                "--wipe-radius": `${burst?.radius ?? 0}px`,
              } as CSSProperties & Record<`--${string}`, string>}
              aria-hidden="true"
            />
          )}
          {burst && (phase === "burst" || phase === "settling" || phase.startsWith("fallback-")) && (
            <ThemeBurstLayer
              burst={burst}
              useViewTransitionNames={phase === "burst" || phase === "settling"}
            />
          )}
        </>
      )}
      <CatMascot
        buttonRef={buttonRef}
        dark={theme === "dark"}
        onToggle={changeTheme}
        disabled={phase !== "idle"}
      />
    </>,
    document.body,
  );
}

export function NightSky() {
  return (
    <div className="night-sky" aria-hidden="true">
      <div className="night-sky-art">
        <div className="night-sky-image">
          <span className="night-moon" />
        </div>
      </div>
      {nightStars.map((star, index) => (
        <span
          className="night-star"
          key={index}
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            "--star-delay": star.delay,
          } as CSSProperties & Record<`--${string}`, string>}
        />
      ))}
    </div>
  );
}

export function TabTitle() {
  useEffect(() => {
    const originalTitle = document.title;
    const updateTitle = () => {
      document.title =
        document.visibilityState === "hidden"
          ? "Quay lại nhé ✨"
          : originalTitle;
    };

    document.addEventListener("visibilitychange", updateTitle);
    return () => {
      document.removeEventListener("visibilitychange", updateTitle);
      document.title = originalTitle;
    };
  }, []);

  return null;
}
