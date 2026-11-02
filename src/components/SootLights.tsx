import { useEffect, useRef } from "react";

const sootLights = [
  { soot: "/soot/soot-1.png", star: "/soot/star-pink.png" },
  { soot: "/soot/soot-2.png", star: "/soot/star-white.png" },
  { soot: "/soot/soot-3.png", star: "/soot/star-green.png" },
];

const followerOffsets = [
  { x: 34, y: -18 },
  { x: 92, y: 12 },
  { x: 148, y: -22 },
];

type Point = { x: number; y: number };
type FlightPhase = "hidden" | "active" | "entering" | "returning";

const sparkOffsets = [
  { x: -40, y: -58 },
  { x: 0, y: -72 },
  { x: 42, y: -54 },
  { x: -56, y: -24 },
  { x: 56, y: -20 },
  { x: -28, y: 18 },
  { x: 28, y: 24 },
  { x: 0, y: 46 },
];

export function SootLights() {
  const rootRef = useRef<HTMLDivElement>(null);
  const beetleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sparkRefs = useRef<Array<HTMLImageElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const positions: Point[] = sootLights.map(() => ({ x: 0, y: 0 }));
    const sparkAnimations = new Set<Animation>();
    const sparkTimeouts = new Set<number>();
    const tapTimeouts = sootLights.map(() => 0);
    let activeSparks = 0;
    let phase: FlightPhase = "hidden";
    let active = false;
    let visible = document.visibilityState === "visible";
    let frameId = 0;
    let transitionStartedAt = 0;
    let transitionFrom: Point[] = [];
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let pointerSeen = false;
    let lastPointerMove = performance.now();
    let hoveredCenter: Point | null = null;
    let bobTime = 0;

    const mascotCenter = (): Point => {
      const mascot = document.querySelector<HTMLElement>(".cat-mascot");
      if (!mascot) return { x: 42, y: window.innerHeight - 42 };
      const bounds = mascot.getBoundingClientRect();
      return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    };

    const setPosition = (index: number, point: Point, angle: number) => {
      positions[index] = point;
      const element = beetleRefs.current[index];
      if (!element) return;
      element.style.transform =
        `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
    };

    const stopFrame = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const hide = () => {
      active = false;
      phase = "hidden";
      stopFrame();
      root.classList.remove("is-active", "is-entering", "is-returning", "is-idle", "is-hovering");
    };

    const scheduleFrame = () => {
      if (!frameId && visible && (active || phase === "returning")) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    function animate(now: number) {
      const root = rootRef.current;
      if (!root) return;
      frameId = 0;
      if (!visible || (!active && phase !== "returning")) return;

      if (reducedMotion.matches || !finePointer.matches) {
        if (phase === "returning") hide();
        return;
      }

      const entering = phase === "entering";
      const returning = phase === "returning";
      const transitionProgress = Math.min(1, (now - transitionStartedAt) / 700);
      const easedProgress = 1 - (1 - transitionProgress) ** 3;
      const idle = now - lastPointerMove > 1500;
      root.classList.toggle("is-idle", idle);
      root.classList.toggle("is-hovering", hoveredCenter !== null && !idle);
      bobTime = now / 1000;

      sootLights.forEach((_, index) => {
        let target: Point;
        if (returning) {
          target = mascotCenter();
        } else {
          const center = hoveredCenter && !idle ? hoveredCenter : pointer;
          if (idle) {
            const angle = (index / sootLights.length) * Math.PI * 2 - Math.PI / 2;
            target = {
              x: center.x + Math.cos(angle) * 44,
              y: center.y + Math.sin(angle) * 30,
            };
          } else {
            const offset = followerOffsets[index];
            target = { x: center.x - offset.x, y: center.y - offset.y };
          }
        }

        if (entering) {
          const origin = transitionFrom[index];
          target = {
            x: origin.x + (target.x - origin.x) * easedProgress,
            y: origin.y + (target.y - origin.y) * easedProgress,
          };
        } else if (returning) {
          const origin = transitionFrom[index];
          target = {
            x: origin.x + (target.x - origin.x) * easedProgress,
            y: origin.y + (target.y - origin.y) * easedProgress,
          };
        }

        const previous = positions[index];
        const follow = idle ? 0.025 : index === 0 ? 0.08 : index === 1 ? 0.06 : 0.045;
        const next = entering || returning
          ? target
          : {
              x: previous.x + (target.x - previous.x) * follow,
              y: previous.y + (target.y - previous.y) * follow,
            };
        const deltaX = next.x - previous.x;
        const angle = entering || returning
          ? 0
          : Math.max(-18, Math.min(18, deltaX * 0.35));
        const bob = entering || returning
          ? 0
          : Math.sin(bobTime * (1.3 + index * 0.16) + index * 1.8) * (idle ? 2 : 4);
        setPosition(index, { x: next.x, y: next.y + bob }, angle);
      });

      if (entering && transitionProgress >= 1) {
        phase = "active";
        root.classList.remove("is-entering");
      } else if (returning && transitionProgress >= 1) {
        hide();
        return;
      }

      scheduleFrame();
    }

    const beginTheme = (isDark: boolean) => {
      const root = rootRef.current;
      if (!root) return;
      if (!isDark) {
        if (!active) {
          hide();
          return;
        }
        if (reducedMotion.matches || !finePointer.matches) {
          hide();
          return;
        }
        active = false;
        phase = "returning";
        root.classList.remove("is-entering", "is-idle", "is-hovering");
        root.classList.add("is-active", "is-returning");
        transitionFrom = positions.map((point) => ({ ...point }));
        transitionStartedAt = performance.now();
        scheduleFrame();
        return;
      }

      if (active && phase !== "returning") return;
      active = true;
      phase = "active";
      root.classList.remove("is-returning", "is-entering");
      root.classList.add("is-active");
      root.classList.toggle("is-mobile", !finePointer.matches);
      root.classList.toggle("is-reduced-motion", reducedMotion.matches);

      if (!finePointer.matches || reducedMotion.matches) {
        phase = "active";
        stopFrame();
        return;
      }

      const origin = mascotCenter();
      positions.forEach((_, index) => setPosition(index, origin, 0));
      transitionFrom = positions.map((point) => ({ ...point }));
      phase = "entering";
      transitionStartedAt = performance.now();
      root.classList.add("is-entering");
      scheduleFrame();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !active || !finePointer.matches || reducedMotion.matches) return;
      const movement = Math.hypot(event.movementX, event.movementY);
      pointer = { x: event.clientX, y: event.clientY };
      if (movement > 0) lastPointerMove = performance.now();

      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("a, button, .card, .service-card, .archive-card, [role='button']")
        : null;
      if (target) {
        const bounds = target.getBoundingClientRect();
        hoveredCenter = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      } else {
        hoveredCenter = null;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!active || reducedMotion.matches || event.button !== 0) return;
      const clickPoint = { x: event.clientX, y: event.clientY };
      const currentPositions = beetleRefs.current.map((beetle, index) => {
        if (!beetle) return positions[index];
        const bounds = beetle.getBoundingClientRect();
        return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      });
      const nearest = currentPositions.reduce(
        (best, point, index) =>
          Math.hypot(point.x - clickPoint.x, point.y - clickPoint.y) <
          Math.hypot(currentPositions[best].x - clickPoint.x, currentPositions[best].y - clickPoint.y)
            ? index
            : best,
        0,
      );

      if (!finePointer.matches || event.pointerType !== "mouse") {
        root.classList.add(`is-tap-glow-${nearest + 1}`);
        window.clearTimeout(tapTimeouts[nearest]);
        tapTimeouts[nearest] = window.setTimeout(
          () => root.classList.remove(`is-tap-glow-${nearest + 1}`),
          400,
        );
        return;
      }

      const origin = currentPositions[nearest];
      const freeSparks = sparkRefs.current
        .map((element, index) => ({ element, index }))
        .filter(({ index }) => !sparkTimeouts.has(index));
      const count = Math.min(3, 8 - activeSparks, freeSparks.length);

      for (let sparkIndex = 0; sparkIndex < count; sparkIndex += 1) {
        const spark = freeSparks[sparkIndex];
        if (!spark.element) continue;
        const direction = sparkOffsets[(spark.index + Math.floor(Math.random() * sparkOffsets.length)) % sparkOffsets.length];
        const size = 18 + Math.random() * 8;
        const dx = direction.x + (Math.random() - 0.5) * 16;
        const dy = direction.y + (Math.random() - 0.5) * 16;
        const fallY = Math.abs(dy) * 0.65 + 24;
        spark.element.src = sootLights[nearest].star;
        spark.element.style.width = `${size}px`;
        spark.element.style.left = `${origin.x}px`;
        spark.element.style.top = `${origin.y}px`;
        spark.element.style.opacity = "1";
        activeSparks += 1;
        const animation = spark.element.animate(
          [
            { transform: "translate(-50%, -50%) scale(0.35) rotate(0deg)", opacity: 0 },
            { transform: "translate(-50%, -50%) scale(1) rotate(18deg)", opacity: 1, offset: 0.18 },
            {
              transform: `translate(calc(-50% + ${dx * 0.72}px), calc(-50% + ${dy}px)) scale(0.88) rotate(52deg)`,
              opacity: 1,
              offset: 0.55,
            },
            {
              transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${fallY}px)) scale(0.2) rotate(110deg)`,
              opacity: 0,
            },
          ],
          { duration: 700, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" },
        );
        sparkAnimations.add(animation);
        sparkTimeouts.add(spark.index);
        animation.onfinish = () => {
          animation.cancel();
          sparkAnimations.delete(animation);
          sparkTimeouts.delete(spark.index);
          activeSparks = Math.max(0, activeSparks - 1);
          spark.element?.style.removeProperty("opacity");
        };
      }
    };

    const onVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      if (!visible) stopFrame();
      else scheduleFrame();
    };

    const syncMotionSettings = () => {
      root.classList.toggle("is-mobile", !finePointer.matches);
      root.classList.toggle("is-reduced-motion", reducedMotion.matches);
      if (reducedMotion.matches || !finePointer.matches) {
        beetleRefs.current.forEach((beetle) => beetle?.style.removeProperty("transform"));
        if (phase === "returning") {
          hide();
          return;
        }
        stopFrame();
      } else if (active) {
        if (phase === "active") {
          const center = pointerSeen ? pointer : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
          positions.forEach((_, index) => {
            const offset = followerOffsets[index];
            setPosition(index, { x: center.x - offset.x, y: center.y - offset.y }, 0);
          });
        }
        scheduleFrame();
      }
    };

    const themeObserver = new MutationObserver(() => {
      beginTheme(document.documentElement.dataset.theme === "dark");
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    finePointer.addEventListener("change", syncMotionSettings);
    reducedMotion.addEventListener("change", syncMotionSettings);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    beginTheme(document.documentElement.dataset.theme === "dark");

    return () => {
      themeObserver.disconnect();
      finePointer.removeEventListener("change", syncMotionSettings);
      reducedMotion.removeEventListener("change", syncMotionSettings);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopFrame();
      sparkAnimations.forEach((animation) => animation.cancel());
      sparkTimeouts.forEach((index) => sparkRefs.current[index]?.style.removeProperty("opacity"));
      sparkTimeouts.clear();
      sparkAnimations.clear();
      tapTimeouts.forEach(window.clearTimeout);
      root.classList.remove(
        "is-active",
        "is-entering",
        "is-returning",
        "is-idle",
        "is-hovering",
        "is-mobile",
        "is-reduced-motion",
      );
    };
  }, []);

  return (
    <div className="soot-lights" ref={rootRef} aria-hidden="true">
      {sootLights.map((light, index) => (
        <div
          className={`soot-light-beetle soot-light-beetle-${index + 1}`}
          key={light.soot}
          ref={(element) => {
            beetleRefs.current[index] = element;
          }}
        >
          <span className="soot-light-aura" />
          <img src={light.soot} alt="" draggable="false" />
        </div>
      ))}
      <div className="soot-light-stars">
        {Array.from({ length: 8 }, (_, index) => (
          <img
            className="soot-light-spark"
            key={index}
            alt=""
            draggable="false"
            ref={(element) => {
              sparkRefs.current[index] = element;
            }}
          />
        ))}
      </div>
    </div>
  );
}
