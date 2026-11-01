import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";

type Theme = "light" | "dark";
type MascotPhase = "idle" | "blink" | "cover" | "reveal";

const nightStars = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 47 + 13) % 97}%`,
  top: `${(index * 61 + 9) % 91}%`,
  delay: `${-((index * 7) % 9)}s`,
  size: `${2 + (index % 3)}px`,
}));

export function WhimsicalMascot() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [phase, setPhase] = useState<MascotPhase>("idle");
  const transitionLock = useRef(false);
  const timeouts = useRef<number[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [wipeOrigin, setWipeOrigin] = useState({ x: "50vw", y: "50vh" });

  useEffect(() => {
    for (const src of ["/cat-red.jpg", "/cat-green.jpg"]) {
      const image = new Image();
      image.src = src;
    }

    return () => {
      timeouts.current.forEach(window.clearTimeout);
    };
  }, []);

  function applyTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);

    try {
      window.localStorage.setItem("portfolio-theme", nextTheme);
    } catch (error) {
      console.warn("Could not save the portfolio theme.", error);
    }
  }

  function changeTheme() {
    if (transitionLock.current) return;
    const nextTheme = theme === "light" ? "dark" : "light";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme(nextTheme);
      return;
    }

    const bounds = buttonRef.current?.getBoundingClientRect();
    if (bounds) {
      setWipeOrigin({
        x: `${bounds.left + bounds.width / 2}px`,
        y: `${bounds.top + bounds.height / 2}px`,
      });
    }

    transitionLock.current = true;
    timeouts.current.forEach(window.clearTimeout);
    setPhase("blink");
    timeouts.current = [
      window.setTimeout(() => setPhase("cover"), 110),
      window.setTimeout(() => {
        applyTheme(nextTheme);
        setPhase("reveal");
      }, 360),
      window.setTimeout(() => {
        setPhase("idle");
        transitionLock.current = false;
      }, 700),
    ];
  }

  return createPortal(
    <>
      {phase !== "idle" && (
        <div
          className={`theme-transition-wipe is-${phase} is-to-${phase === "reveal" ? theme : theme === "light" ? "dark" : "light"}`}
          style={{
            "--wipe-x": wipeOrigin.x,
            "--wipe-y": wipeOrigin.y,
          } as CSSProperties & Record<`--${string}`, string>}
          aria-hidden="true"
        />
      )}
      <button
        ref={buttonRef}
        className={`whimsical-mascot is-${phase}`}
        type="button"
        aria-label={`Chuyển sang theme ${theme === "light" ? "tối" : "sáng"}`}
        aria-pressed={theme === "dark"}
        disabled={phase !== "idle"}
        onClick={changeTheme}
      >
        <img
          className="mascot-cat"
          src={theme === "dark" ? "/cat-green.jpg" : "/cat-red.jpg"}
          alt=""
        />
        <span className="mascot-sparkle mascot-sparkle-one" aria-hidden="true" />
        <span className="mascot-sparkle mascot-sparkle-two" aria-hidden="true" />
        <span className="mascot-sparkle mascot-sparkle-three" aria-hidden="true" />
      </button>
    </>,
    document.body,
  );
}

export function NightSky() {
  return (
    <div className="night-sky" aria-hidden="true">
      <span className="night-moon" />
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
