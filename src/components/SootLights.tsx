import { useEffect, useRef } from "react";

const sootLights = [
  { soot: "/soot/soot-1.png", star: "/soot/star-white.png" },
  { soot: "/soot/soot-2.png", star: "/soot/star-white.png" },
  { soot: "/soot/soot-3.png", star: "/soot/star-green.png" },
];

const followerOffsets = [
  { x: 34, y: -18 },
  { x: 92, y: 12 },
  { x: 148, y: -22 },
];
const mobileAnchors = [0.14, 0.5, 0.86];
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

type Point = { x: number; y: number };
type FlightPhase = "hidden" | "active" | "entering" | "returning";

export function SootLights() {
  const rootRef = useRef<HTMLDivElement>(null);
  const beetleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imageRefs = useRef<Array<HTMLImageElement | null>>([]);
  const shadowRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sparkRefs = useRef<Array<HTMLImageElement | null>>([]);

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return;
    const root: HTMLDivElement = rootElement;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const positions: Point[] = sootLights.map(() => ({ x: 0, y: 0 }));
    const sparkAnimations = new Set<Animation>();
    const activeSparks = new Set<number>();
    const tapTimeouts = sootLights.map(() => 0);
    const hopAnimations: Array<{ body: Animation; shadow: Animation } | null> =
      sootLights.map(() => null);
    const nextHopAt = sootLights.map(() => 0);
    let active = false;
    let visible = document.visibilityState === "visible";
    let frameId = 0;
    let phase: FlightPhase = "hidden";
    let transitionStartedAt = 0;
    let transitionFrom: Point[] = [];
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lastPointerMove = performance.now();
    let lastFrameAt = performance.now();
    let lastRectScan = 0;
    let obstacleRects: Array<{ bounds: DOMRect; padding: number }> = [];
    let hoveringInteractive = false;

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

    const stopHop = (index: number) => {
      const animation = hopAnimations[index];
      if (!animation) return;
      animation.body.cancel();
      animation.shadow.cancel();
      hopAnimations[index] = null;
    };

    const stopHops = (scheduleNext = false) => {
      hopAnimations.forEach((_, index) => {
        stopHop(index);
        if (scheduleNext) nextHopAt[index] = performance.now() + randomBetween(6000, 12000);
      });
    };

    const startHop = (index: number) => {
      const body = imageRefs.current[index];
      const shadow = shadowRefs.current[index];
      if (!body || !shadow || hopAnimations[index]) return;

      const duration = randomBetween(620, 740);
      const bodyAnimation = body.animate(
        [
          { transform: "translateY(0) scale(1, 1)", offset: 0 },
          { transform: "translateY(2px) scale(1.06, 0.94)", offset: 0.16 },
          { transform: "translateY(-18px) scale(0.97, 1.04)", offset: 0.58 },
          { transform: "translateY(0) scale(1.06, 0.94)", offset: 0.88 },
          { transform: "translateY(0) scale(1, 1)", offset: 1 },
        ],
        { duration, easing: "cubic-bezier(0.2, 0.68, 0.3, 1)" },
      );
      const shadowAnimation = shadow.animate(
        [
          { transform: "translateX(-50%) scale(1, 1)", opacity: 0.42 },
          { transform: "translateX(-50%) scale(0.68, 0.8)", opacity: 0.22, offset: 0.58 },
          { transform: "translateX(-50%) scale(1.06, 1.04)", opacity: 0.4, offset: 0.88 },
          { transform: "translateX(-50%) scale(1, 1)", opacity: 0.42 },
        ],
        { duration, easing: "cubic-bezier(0.2, 0.68, 0.3, 1)" },
      );
      hopAnimations[index] = { body: bodyAnimation, shadow: shadowAnimation };
      bodyAnimation.onfinish = () => {
        stopHop(index);
        nextHopAt[index] = performance.now() + randomBetween(6000, 12000);
      };
    };

    const mascotCenter = (): Point => {
      const mascot = document.querySelector<HTMLElement>(".cat-mascot");
      if (!mascot) return { x: 42, y: window.innerHeight - 42 };
      const bounds = mascot.getBoundingClientRect();
      return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    };

    const clampPoint = (point: Point): Point => {
      const padding = 56;
      return {
        x: window.innerWidth < padding * 2
          ? window.innerWidth / 2
          : Math.max(padding, Math.min(window.innerWidth - padding, point.x)),
        y: window.innerHeight < padding * 2
          ? window.innerHeight / 2
          : Math.max(padding, Math.min(window.innerHeight - padding, point.y)),
      };
    };

    const scanObstacles = (now: number) => {
      if (now - lastRectScan < 500) return;
      lastRectScan = now;
      obstacleRects = Array.from(
        document.querySelectorAll<HTMLElement>(
          "a, button, input, textarea, h1, h2, .card, .project-card, .service-card, .archive-card, .night-moon, [role='button']",
        ),
      )
        .map((element) => ({
          bounds: element.getBoundingClientRect(),
          padding: element.matches(".night-moon") ? 180 : 56,
        }))
        .filter(({ bounds }) =>
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.bottom > 0 &&
          bounds.top < window.innerHeight &&
          bounds.right > 0 &&
          bounds.left < window.innerWidth,
        );
    };

    const avoidObstacles = (point: Point) => {
      let safe = clampPoint(point);
      obstacleRects.forEach(({ bounds: rect, padding }) => {
        const left = rect.left - padding;
        const right = rect.right + padding;
        const top = rect.top - padding;
        const bottom = rect.bottom + padding;
        if (safe.x <= left || safe.x >= right || safe.y <= top || safe.y >= bottom) return;
        const options = [
          { x: safe.x, y: top },
          { x: safe.x, y: bottom },
          { x: left, y: safe.y },
          { x: right, y: safe.y },
        ];
        safe = clampPoint(
          options.reduce((best, option) =>
            Math.hypot(option.x - safe.x, option.y - safe.y) <
            Math.hypot(best.x - safe.x, best.y - safe.y)
              ? option
              : best,
          ),
        );
      });
      return safe;
    };

    const setPosition = (
      index: number,
      point: Point,
      angle: number,
      flip: number,
      scaleX: number,
      scaleY: number,
    ) => {
      positions[index] = point;
      const beetle = beetleRefs.current[index];
      if (beetle) {
        beetle.style.transform =
          `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) ` +
          `rotate(${angle}deg) scaleX(${flip}) scale(${scaleX}, ${scaleY})`;
      }
    };

    const stopFrame = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const hide = () => {
      active = false;
      phase = "hidden";
      stopFrame();
      stopHops();
      root.classList.remove("is-active", "is-entering", "is-returning", "is-idle", "is-hovering");
    };

    const scheduleFrame = () => {
      if (!frameId && visible && (active || phase === "returning") && !reducedMotion.matches) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    function animate(now: number) {
      frameId = 0;
      if (!visible || (!active && phase !== "returning") || reducedMotion.matches) return;

      const mobile = !finePointer.matches;
      const entering = phase === "entering";
      const returning = phase === "returning";
      const elapsed = Math.min(50, Math.max(1, now - lastFrameAt));
      lastFrameAt = now;
      const idle = now - lastPointerMove > 2000;
      root.classList.toggle("is-idle", idle);
      root.classList.toggle("is-hovering", hoveringInteractive);
      scanObstacles(now);

      const transitionProgress = Math.min(1, (now - transitionStartedAt) / 700);
      const easedProgress = 1 - (1 - transitionProgress) ** 3;

      sootLights.forEach((_, index) => {
        const previous = positions[index];
        const offset = followerOffsets[index];
        let target = mobile
          ? { x: window.innerWidth * mobileAnchors[index], y: window.innerHeight - 46 }
          : returning
            ? mascotCenter()
            : { x: pointer.x - offset.x, y: pointer.y - offset.y };
        target = avoidObstacles(target);

        if (entering || returning) {
          const origin = transitionFrom[index];
          target = {
            x: origin.x + (target.x - origin.x) * easedProgress,
            y: origin.y + (target.y - origin.y) * easedProgress,
          };
        }

        const follow = entering || returning
          ? 1
          : 1 - Math.exp(-elapsed / (index === 0 ? 620 : index === 1 ? 760 : 900));
        const next = {
          x: previous.x + (target.x - previous.x) * follow,
          y: previous.y + (target.y - previous.y) * follow,
        };
        const distance = Math.hypot(next.x - previous.x, next.y - previous.y);
        const walking = !mobile && !entering && !returning && distance > 0.08;
        if (!mobile && idle && !entering && !returning && now >= nextHopAt[index]) {
          startHop(index);
        }

        const stridePhase = ((now / (1000 + index * 100) + index * 0.23) % 1 + 1) % 1;
        const strideKeyframes = [
          { x: 1, y: 1 },
          { x: 1.06, y: 0.94 },
          { x: 1, y: 0.99 },
          { x: 0.97, y: 1.04 },
          { x: 1, y: 1 },
        ];
        const stridePosition = stridePhase * (strideKeyframes.length - 1);
        const strideIndex = Math.floor(stridePosition);
        const strideBlend = (stridePosition - strideIndex) ** 2 * (3 - 2 * (stridePosition - strideIndex));
        const strideStart = strideKeyframes[strideIndex];
        const strideEnd = strideKeyframes[Math.min(strideIndex + 1, strideKeyframes.length - 1)];
        const strideX = walking ? strideStart.x + (strideEnd.x - strideStart.x) * strideBlend : 1;
        const strideY = walking ? strideStart.y + (strideEnd.y - strideStart.y) * strideBlend : 1;
        const direction = next.x < previous.x - 0.02 ? -1 : next.x > previous.x + 0.02 ? 1 : 0;
        const beetle = beetleRefs.current[index];
        const previousDirection = beetle?.dataset.direction === "-1" ? -1 : 1;
        const flip = direction === 0 ? previousDirection : direction;
        if (beetle && direction !== 0) beetle.dataset.direction = String(direction);
        const angle = walking
          ? Math.sign(next.x - previous.x) * (2 + Math.min(1, distance / 2))
          : 0;
        const point = avoidObstacles(clampPoint(next));

        setPosition(
          index,
          point,
          angle,
          flip,
          strideX,
          strideY,
        );
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
        stopHops();
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

      const now = performance.now();
      nextHopAt.forEach((_, index) => {
        nextHopAt[index] = now + 6000 + index * 2200 + randomBetween(0, 1200);
      });
      stopHops();

      if (reducedMotion.matches) {
        stopFrame();
        return;
      }

      if (!finePointer.matches) {
        positions.forEach((_, index) => {
          setPosition(
            index,
            { x: window.innerWidth * mobileAnchors[index], y: window.innerHeight - 46 },
            0,
            1,
            1,
            1,
          );
        });
        return;
      }

      const origin = mascotCenter();
      positions.forEach((_, index) => setPosition(index, origin, 0, 1, 1, 1));
      transitionFrom = positions.map((point) => ({ ...point }));
      phase = "entering";
      transitionStartedAt = now;
      root.classList.add("is-entering");
      lastFrameAt = now;
      scheduleFrame();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !active || !finePointer.matches || reducedMotion.matches) return;
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 0.5) {
        pointer = { x: event.clientX, y: event.clientY };
        const now = performance.now();
        lastPointerMove = now;
        stopHops(true);
        nextHopAt.forEach((_, index) => {
          nextHopAt[index] = now + randomBetween(6000, 12000);
        });
      }

      const target = event.target instanceof Element
        ? event.target.closest("a, button, .card, .project-card, .service-card, .archive-card, [role='button']")
        : null;
      hoveringInteractive = target !== null;
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
        .filter(({ index }) => !activeSparks.has(index));
      const count = Math.min(3, 8 - activeSparks.size, freeSparks.length);

      for (let sparkIndex = 0; sparkIndex < count; sparkIndex += 1) {
        const spark = freeSparks[sparkIndex];
        if (!spark.element) continue;
        const direction = sparkOffsets[
          (spark.index + Math.floor(Math.random() * sparkOffsets.length)) % sparkOffsets.length
        ];
        const size = 18 + Math.random() * 8;
        const dx = direction.x + (Math.random() - 0.5) * 16;
        const dy = direction.y + (Math.random() - 0.5) * 16;
        const fallY = Math.abs(dy) * 0.65 + 24;
        spark.element.src = sootLights[nearest].star;
        spark.element.style.width = `${size}px`;
        spark.element.style.left = `${origin.x}px`;
        spark.element.style.top = `${origin.y}px`;
        spark.element.style.opacity = "1";
        activeSparks.add(spark.index);
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
        animation.onfinish = () => {
          animation.cancel();
          sparkAnimations.delete(animation);
          activeSparks.delete(spark.index);
          spark.element?.style.removeProperty("opacity");
        };
      }
    };

    const onVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      if (!visible) {
        stopFrame();
        stopHops(true);
      } else {
        scheduleFrame();
      }
    };

    const onResize = () => {
      lastRectScan = 0;
      if (!finePointer.matches && active) {
        positions.forEach((_, index) => {
          setPosition(
            index,
            { x: window.innerWidth * mobileAnchors[index], y: window.innerHeight - 46 },
            0,
            1,
            1,
            1,
          );
        });
      }
    };

    const syncMotionSettings = () => {
      root.classList.toggle("is-mobile", !finePointer.matches);
      root.classList.toggle("is-reduced-motion", reducedMotion.matches);
      if (reducedMotion.matches) {
        stopFrame();
        stopHops(true);
        beetleRefs.current.forEach((beetle) => beetle?.style.removeProperty("transform"));
        return;
      }
      if (active) {
        nextHopAt.forEach((_, index) => {
          nextHopAt[index] = performance.now() + randomBetween(6000, 12000);
        });
        if (!finePointer.matches) {
          stopHops();
          positions.forEach((_, index) => {
            setPosition(
              index,
              { x: window.innerWidth * mobileAnchors[index], y: window.innerHeight - 46 },
              0,
              1,
              1,
              1,
            );
          });
        } else {
          const origin = mascotCenter();
          positions.forEach((_, index) => setPosition(index, origin, 0, 1, 1, 1));
          phase = "entering";
          transitionFrom = positions.map((point) => ({ ...point }));
          transitionStartedAt = performance.now();
          root.classList.add("is-entering");
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
    window.addEventListener("resize", onResize);
    beginTheme(document.documentElement.dataset.theme === "dark");

    return () => {
      themeObserver.disconnect();
      finePointer.removeEventListener("change", syncMotionSettings);
      reducedMotion.removeEventListener("change", syncMotionSettings);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
      stopFrame();
      stopHops();
      sparkAnimations.forEach((animation) => animation.cancel());
      activeSparks.forEach((index) => sparkRefs.current[index]?.style.removeProperty("opacity"));
      activeSparks.clear();
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
          <span
            className="soot-light-shadow"
            ref={(element) => {
              shadowRefs.current[index] = element;
            }}
          />
          <img
            src={light.soot}
            alt=""
            draggable="false"
            ref={(element) => {
              imageRefs.current[index] = element;
            }}
          />
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
