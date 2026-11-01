import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MascotPhase = "idle" | "blink" | "wipe" | "pop";

export function WhimsicalMascot() {
  const [greenCat, setGreenCat] = useState(false);
  const [phase, setPhase] = useState<MascotPhase>("idle");
  const transitionLock = useRef(false);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    for (const src of ["/cat-red.jpg", "/cat-green.jpg"]) {
      const image = new Image();
      image.src = src;
    }

    return () => {
      timeouts.current.forEach(window.clearTimeout);
    };
  }, []);

  function changeCat() {
    if (transitionLock.current) return;
    const nextCatIsGreen = !greenCat;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGreenCat(nextCatIsGreen);
      return;
    }

    transitionLock.current = true;
    timeouts.current.forEach(window.clearTimeout);
    setPhase("blink");
    timeouts.current = [
      window.setTimeout(() => setPhase("wipe"), 110),
      window.setTimeout(() => {
        setGreenCat(nextCatIsGreen);
        setPhase("pop");
      }, 360),
      window.setTimeout(() => {
        setPhase("idle");
        transitionLock.current = false;
      }, 700),
    ];
  }

  return createPortal(
    <button
      className={`whimsical-mascot is-${phase}`}
      type="button"
      aria-label="Đổi mèo"
      disabled={phase !== "idle"}
      onClick={changeCat}
    >
      <img
        className="mascot-cat"
        src={greenCat ? "/cat-green.jpg" : "/cat-red.jpg"}
        alt=""
      />
      <span className="mascot-color-wipe" aria-hidden="true" />
      <span className="mascot-sparkle mascot-sparkle-one" aria-hidden="true" />
      <span className="mascot-sparkle mascot-sparkle-two" aria-hidden="true" />
      <span className="mascot-sparkle mascot-sparkle-three" aria-hidden="true" />
    </button>,
    document.body,
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
