import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function WhimsicalMascot() {
  const [jumping, setJumping] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timeout.current);
    },
    [],
  );

  function makeJump() {
    window.clearTimeout(timeout.current);
    setJumping(true);
    timeout.current = window.setTimeout(() => setJumping(false), 850);
  }

  return createPortal(
    <button
      className={`whimsical-mascot${jumping ? " is-jumping" : ""}`}
      type="button"
      aria-label="Make Kiki's cat jump"
      onClick={makeJump}
    >
      <img src="/kikis-logo.png" alt="" />
      <span className="mascot-sparkle mascot-sparkle-one" />
      <span className="mascot-sparkle mascot-sparkle-two" />
      <span className="mascot-sparkle mascot-sparkle-three" />
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
