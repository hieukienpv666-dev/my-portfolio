import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

const dustParticles = Array.from({ length: 16 }, (_, index) => ({
  left: `${(index * 47 + 11) % 97}%`,
  top: `${(index * 61 + 8) % 94}%`,
  size: `${2 + (index % 3)}px`,
  drift: `${((index % 5) - 2) * 13}px`,
  duration: `${12 + (index % 7) * 2}s`,
  delay: `${-((index * 3) % 18)}s`,
}));

const petals = Array.from({ length: 4 }, (_, index) => ({
  left: `${(index * 29 + 18) % 90}%`,
  top: `${(index * 37 + 15) % 88}%`,
  drift: `${(index % 2 === 0 ? 1 : -1) * (18 + index * 5)}px`,
  duration: `${19 + index * 3}s`,
  delay: `${-index * 4}s`,
  rotation: `${index * 37}deg`,
}));

function AmbientParticles() {
  return (
    <div className="ambient-particles" aria-hidden="true">
      <div className="ambient-dust-layer">
        {dustParticles.map((particle, index) => (
          <span
            className="ambient-dust"
            key={`dust-${index}`}
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              "--ambient-drift": particle.drift,
              "--ambient-duration": particle.duration,
              "--ambient-delay": particle.delay,
            } as CSSProperties & Record<`--${string}`, string>}
          />
        ))}
      </div>
      <div className="ambient-petal-layer">
        {petals.map((petal, index) => (
          <span
            className="ambient-petal"
            key={`petal-${index}`}
            style={{
              left: petal.left,
              top: petal.top,
              "--ambient-drift": petal.drift,
              "--ambient-duration": petal.duration,
              "--ambient-delay": petal.delay,
              "--ambient-rotation": petal.rotation,
            } as CSSProperties & Record<`--${string}`, string>}
          />
        ))}
      </div>
    </div>
  );
}

function ScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

        progressRef.current?.style.setProperty(
          "transform",
          `scaleX(${Math.min(1, Math.max(0, progress))})`,
        );
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return <div className="scroll-progress" ref={progressRef} aria-hidden="true" />;
}

function MagicCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const sparkleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sparkleTimeouts = useRef<Array<number | undefined>>([]);
  const latestPosition = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const lastSparkleTime = useRef(0);
  const sparkleIndex = useRef(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    let listening = false;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      latestPosition.current = { x: event.clientX, y: event.clientY };
      if (frame.current) return;

      frame.current = requestAnimationFrame((time) => {
        frame.current = 0;
        const { x, y } = latestPosition.current;
        cursorRef.current?.style.setProperty(
          "transform",
          `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
        );

        if (time - lastSparkleTime.current < 90) return;
        lastSparkleTime.current = time;

        const index = sparkleIndex.current % sparkleRefs.current.length;
        sparkleIndex.current += 1;
        const sparkle = sparkleRefs.current[index];
        if (!sparkle) return;

        window.clearTimeout(sparkleTimeouts.current[index]);
        sparkle.style.transition = "none";
        sparkle.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
        sparkle.style.opacity = "0.85";

        requestAnimationFrame(() => {
          sparkle.style.transition =
            "transform 650ms ease-out, opacity 650ms ease-out";
          sparkle.style.transform = `translate3d(${x + (index % 2 ? 10 : -10)}px, ${y + 22}px, 0) scale(0.35)`;
          sparkle.style.opacity = "0";
        });
        sparkleTimeouts.current[index] = window.setTimeout(() => {
          sparkle.style.transition = "";
        }, 700);
      });
    };

    const syncPointerListener = () => {
      const shouldListen = finePointer.matches && !reducedMotion.matches;
      if (shouldListen === listening) return;

      listening = shouldListen;
      if (listening) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
      } else {
        window.removeEventListener("pointermove", onPointerMove);
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        cursorRef.current?.style.removeProperty("transform");
        sparkleRefs.current.forEach((sparkle) => {
          sparkle?.style.removeProperty("transform");
          sparkle?.style.removeProperty("opacity");
          sparkle?.style.removeProperty("transition");
        });
        sparkleTimeouts.current.forEach((timeout) =>
          window.clearTimeout(timeout),
        );
        sparkleTimeouts.current = [];
      }
    };

    syncPointerListener();
    finePointer.addEventListener("change", syncPointerListener);
    reducedMotion.addEventListener("change", syncPointerListener);

    return () => {
      finePointer.removeEventListener("change", syncPointerListener);
      reducedMotion.removeEventListener("change", syncPointerListener);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame.current);
      sparkleTimeouts.current.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="magic-cursor" aria-hidden="true">
      <span className="magic-cursor-glow" ref={cursorRef} />
      {Array.from({ length: 4 }, (_, index) => (
        <span
          className="magic-cursor-sparkle"
          key={index}
          ref={(element) => {
            sparkleRefs.current[index] = element;
          }}
        />
      ))}
    </div>
  );
}

export function Ambient() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <AmbientParticles />
      </div>
      <MagicCursor />
      <ScrollProgress />
    </>
  );
}
