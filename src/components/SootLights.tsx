import { useEffect, useRef } from "react";

type RigPart = { src: string; origin: readonly [number, number] };
type SootLight = {
  id: string;
  body: string;
  star: string;
  size: readonly [number, number];
  legs: readonly [RigPart, RigPart];
  eyes: readonly [RigPart, RigPart];
  blinkDuration: string;
  blinkDelay: string;
};

const sootLights: SootLight[] = [
  {
    id: "soot-1",
    body: "/soot/rig/soot-1-body.png",
    star: "/soot/star-white.png",
    size: [270, 220],
    legs: [
      { src: "/soot/rig/soot-1-leg1.png", origin: [28.52, 69.09] },
      { src: "/soot/rig/soot-1-leg2.png", origin: [79.26, 57.73] },
    ],
    eyes: [
      { src: "/soot/rig/soot-1-eye1.png", origin: [45.49, 38.3] },
      { src: "/soot/rig/soot-1-eye2.png", origin: [59.87, 30.67] },
    ],
    blinkDuration: "12.9s",
    blinkDelay: "-2.1s",
  },
  {
    id: "soot-2",
    body: "/soot/rig/soot-2-body.png",
    star: "/soot/star-white.png",
    size: [209, 220],
    legs: [
      { src: "/soot/rig/soot-2-leg1.png", origin: [27.75, 75] },
      { src: "/soot/rig/soot-2-leg2.png", origin: [85.17, 70.45] },
    ],
    eyes: [
      { src: "/soot/rig/soot-2-eye1.png", origin: [47.92, 50.99] },
      { src: "/soot/rig/soot-2-eye2.png", origin: [63.73, 56.11] },
    ],
    blinkDuration: "15.3s",
    blinkDelay: "-7.4s",
  },
  {
    id: "soot-3",
    body: "/soot/rig/soot-3-body.png",
    star: "/soot/star-green.png",
    size: [140, 220],
    legs: [
      { src: "/soot/rig/soot-3-leg1.png", origin: [31.43, 92.27] },
      { src: "/soot/rig/soot-3-leg2.png", origin: [85.71, 74.09] },
    ],
    eyes: [
      { src: "/soot/rig/soot-3-eye1.png", origin: [32.28, 60.98] },
      { src: "/soot/rig/soot-3-eye2.png", origin: [54.67, 56.85] },
    ],
    blinkDuration: "18.6s",
    blinkDelay: "-11.2s",
  },
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
type MotionState = {
  heading: number;
  speed: number;
  baseSpeed: number;
  phaseOffset: number;
  goal: Point;
  pauseUntil: number;
  lookUntil: number;
  lookDirection: number;
  facing: number;
};

const motionProfiles = [
  { baseSpeed: 72, phaseOffset: 0.4 },
  { baseSpeed: 91, phaseOffset: 2.7 },
  { baseSpeed: 108, phaseOffset: 4.9 },
];

export function SootLights() {
  const rootRef = useRef<HTMLDivElement>(null);
  const beetleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rigRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sparkRefs = useRef<Array<HTMLImageElement | null>>([]);

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return;
    const root: HTMLDivElement = rootElement;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const positions: Point[] = sootLights.map(() => ({ x: 0, y: 0 }));
    const motion: MotionState[] = motionProfiles.map((profile) => ({
      ...profile,
      heading: profile.phaseOffset,
      speed: 0,
      goal: { x: 0, y: 0 },
      pauseUntil: 0,
      lookUntil: 0,
      lookDirection: 1,
      facing: 1,
    }));
    const sparkAnimations = new Set<Animation>();
    const activeSparks = new Set<number>();
    const tapTimeouts = sootLights.map(() => 0);
    const walkStopTimeouts = sootLights.map(() => 0);
    const stepDurationLevels = sootLights.map(() => -1);
    const walkingStates = sootLights.map(() => false);
    let active = false;
    let visible = document.visibilityState === "visible";
    let frameId = 0;
    let phase: FlightPhase = "hidden";
    let lastThemeStartedAt = 0;
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let pointerBurstUntil = 0;
    let lastFrameAt = performance.now();
    let lastRectScan = 0;
    let obstacleRects: Array<{ bounds: DOMRect; padding: number }> = [];
    let hoveringInteractive = false;

    const updateWalking = (index: number, moving: boolean, speed: number) => {
      const beetle = beetleRefs.current[index];
      const rig = rigRefs.current[index];
      if (!beetle || !rig) return;

      if (moving) {
        window.clearTimeout(walkStopTimeouts[index]);
        walkStopTimeouts[index] = 0;
        beetle.classList.add("is-walking");
        walkingStates[index] = true;

        const level = speed < 82 ? 0 : speed < 145 ? 1 : 2;
        if (stepDurationLevels[index] !== level) {
          rig.style.setProperty("--step-duration", ["550ms", "420ms", "320ms"][level]);
          stepDurationLevels[index] = level;
        }
      } else if (walkingStates[index] && !walkStopTimeouts[index]) {
        walkStopTimeouts[index] = window.setTimeout(() => {
          walkStopTimeouts[index] = 0;
          walkingStates[index] = false;
          beetle.classList.remove("is-walking");
        }, 180);
      }
    };

    const stopWalking = () => {
      walkingStates.forEach((_, index) => {
        window.clearTimeout(walkStopTimeouts[index]);
        walkStopTimeouts[index] = 0;
        walkingStates[index] = false;
        beetleRefs.current[index]?.classList.remove("is-walking");
      });
    };

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
    const approach = (current: number, target: number, amount: number) =>
      current < target ? Math.min(current + amount, target) : Math.max(current - amount, target);
    const wrapAngle = (angle: number) =>
      ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

    const wanderPoint = (index: number, now: number): Point => {
      const { phaseOffset } = motion[index];
      const time = now;
      const angle = phaseOffset + time * 0.00014 + Math.sin(time * 0.00031 + phaseOffset) * 0.42;
      const radius =
        95 +
        Math.sin(time * 0.00019 + phaseOffset * 1.3) * 26 +
        Math.sin(time * 0.00033 + phaseOffset * 0.7) * 18;
      return avoidObstacles({
        x: pointer.x + Math.cos(angle) * radius,
        y: pointer.y + Math.sin(angle) * radius,
      });
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
          "a, button, input, textarea, .night-moon, [role='button']",
        ),
      )
        .map((element) => ({
          bounds: element.getBoundingClientRect(),
          padding: 36,
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
    ) => {
      positions[index] = point;
      const beetle = beetleRefs.current[index];
      if (beetle) {
        beetle.style.transform =
          `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) ` +
          `rotate(${angle}deg) scaleX(${flip})`;
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
      stopWalking();
      root.classList.remove("is-active", "is-entering", "is-returning", "is-hovering");
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
      if (mobile && phase !== "returning") {
        stopWalking();
        return;
      }
      const entering = phase === "entering";
      const returning = phase === "returning";
      const deltaTime = Math.min(0.05, Math.max(0.001, (now - lastFrameAt) / 1000));
      lastFrameAt = now;
      root.classList.toggle("is-hovering", hoveringInteractive);
      scanObstacles(now);

      const pointerWasTeleported = now < pointerBurstUntil;
      const centers = sootLights.map((_, index) =>
        mobile
          ? { x: window.innerWidth * mobileAnchors[index], y: window.innerHeight - 46 }
          : returning
            ? mascotCenter()
            : pointer,
      );
      let allReturned = true;
      sootLights.forEach((_, index) => {
        const state = motion[index];
        const current = positions[index];
        let target = mobile ? centers[index] : returning ? mascotCenter() : state.goal;
        const pointerDistance = Math.hypot(current.x - pointer.x, current.y - pointer.y);

        if (!mobile && !returning && !entering) {
          if (state.pauseUntil > 0 && now >= state.pauseUntil) {
            state.pauseUntil = 0;
            state.goal = wanderPoint(index, now);
          }

          if (state.pauseUntil > now) {
            target = current;
          } else if (Math.hypot(state.goal.x - current.x, state.goal.y - current.y) < 8) {
            state.pauseUntil = now + randomBetween(600, 2200);
            if (Math.random() < 0.48) {
              state.lookUntil = now + randomBetween(260, 680);
              state.lookDirection = -state.facing;
            } else {
              state.lookUntil = 0;
            }
            target = current;
          }
        }

        if (!returning) target = avoidObstacles(target);
        const separation = { x: 0, y: 0 };
        if (!mobile && !returning) {
          positions.forEach((other, otherIndex) => {
            if (otherIndex === index) return;
            let dx = current.x - other.x;
            let dy = current.y - other.y;
            let distance = Math.hypot(dx, dy);
            if (distance >= 44) return;
            if (distance < 0.001) {
              const fallback = (Math.min(index, otherIndex) + 1) * 2.4;
              const direction = index < otherIndex ? 1 : -1;
              dx = Math.cos(fallback) * direction;
              dy = Math.sin(fallback) * direction;
              distance = 1;
            }
            const strength = (44 - distance) * 3;
            separation.x += (dx / distance) * strength;
            separation.y += (dy / distance) * strength;
          });
        }

        const steeringTarget = {
          x: target.x + separation.x,
          y: target.y + separation.y,
        };
        const dx = steeringTarget.x - current.x;
        const dy = steeringTarget.y - current.y;
        const targetDistance = Math.hypot(dx, dy);
        const desiredHeading = targetDistance > 0.5 ? Math.atan2(dy, dx) : state.heading;
        const headingError = wrapAngle(desiredHeading - state.heading);
        const maxTurn = Math.PI * deltaTime;
        state.heading += Math.max(-maxTurn, Math.min(maxTurn, headingError));

        const turningAlignment = Math.max(0.35, Math.cos(headingError));
        const runFactor = Math.max(0, Math.min(1, (pointerDistance - 180) / 450));
        const cruiseSpeed = pointerWasTeleported
          ? 220
          : state.baseSpeed + (220 - state.baseSpeed) * runFactor;
        const brakingSpeed = Math.sqrt(Math.max(0, 2 * 180 * Math.max(0, targetDistance - 6)));
        const paused = !mobile && !returning && !entering && state.pauseUntil > now;
        const desiredSpeed = mobile
          ? 0
          : paused
            ? 0
            : Math.min(cruiseSpeed, brakingSpeed) * turningAlignment;
        const acceleration = desiredSpeed < state.speed ? 180 : 95;
        state.speed = approach(state.speed, desiredSpeed, acceleration * deltaTime);
        let next = mobile
          ? target
          : {
              x: current.x + Math.cos(state.heading) * state.speed * deltaTime,
              y: current.y + Math.sin(state.heading) * state.speed * deltaTime,
            };
        if (!mobile && !returning) {
          positions.forEach((other, otherIndex) => {
            if (otherIndex === index) return;
            const currentGap = Math.hypot(current.x - other.x, current.y - other.y);
            const nextGap = Math.hypot(next.x - other.x, next.y - other.y);
            if (nextGap >= 44) return;
            if (currentGap < 44) {
              if (nextGap < currentGap) next = current;
              return;
            }
            const fraction = (currentGap - 44) / (currentGap - nextGap);
            next = {
              x: current.x + (next.x - current.x) * fraction,
              y: current.y + (next.y - current.y) * fraction,
            };
          });
        }
        const actualDx = next.x - current.x;
        const moving =
          !mobile &&
          state.speed > 7 &&
          (Math.abs(actualDx) > 0.04 || Math.abs(next.y - current.y) > 0.04);
        updateWalking(index, moving, state.speed);
        if (moving && Math.abs(actualDx) > 0.04) state.facing = actualDx < 0 ? -1 : 1;
        const flip = now < state.lookUntil ? state.lookDirection : state.facing;
        const beetle = beetleRefs.current[index];
        if (beetle) beetle.dataset.direction = String(flip);
        const angle = moving
          ? Math.sign(actualDx || Math.cos(state.heading)) * 2.5
          : 0;
        const point = clampPoint(next);

        setPosition(index, point, angle, flip);
        if (returning && Math.hypot(centers[index].x - point.x, centers[index].y - point.y) > 16) {
          allReturned = false;
        }
      });

      if (entering && now - lastThemeStartedAt >= 700) {
        phase = "active";
        root.classList.remove("is-entering");
      } else if (returning && (allReturned || now - lastThemeStartedAt > 6000)) {
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
        lastThemeStartedAt = performance.now();
        root.classList.remove("is-entering", "is-hovering");
        root.classList.add("is-active", "is-returning");
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
          );
        });
        return;
      }

      const origin = mascotCenter();
      positions.forEach((_, index) => {
        const state = motion[index];
        setPosition(index, origin, 0, 1);
        state.heading = state.phaseOffset;
        state.speed = 0;
        state.pauseUntil = 0;
        state.lookUntil = 0;
        state.facing = 1;
        state.goal = wanderPoint(index, now);
      });
      phase = "entering";
      lastThemeStartedAt = now;
      root.classList.add("is-entering");
      lastFrameAt = now;
      scheduleFrame();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !active || !finePointer.matches || reducedMotion.matches) return;
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 0.5) {
        const jumpDistance = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
        pointer = { x: event.clientX, y: event.clientY };
        if (jumpDistance > 80) {
          const now = performance.now();
          pointerBurstUntil = now + 800;
          motion.forEach((state, index) => {
            state.goal = wanderPoint(index, now);
            state.pauseUntil = 0;
          });
        }
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
        stopWalking();
      } else {
        lastFrameAt = performance.now();
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
          );
        });
      }
    };

    const syncMotionSettings = () => {
      root.classList.toggle("is-mobile", !finePointer.matches);
      root.classList.toggle("is-reduced-motion", reducedMotion.matches);
      if (reducedMotion.matches) {
        stopFrame();
        stopWalking();
        beetleRefs.current.forEach((beetle) => beetle?.style.removeProperty("transform"));
        return;
      }
      if (active) {
        if (!finePointer.matches) {
          stopWalking();
          positions.forEach((_, index) => {
            setPosition(
              index,
              { x: window.innerWidth * mobileAnchors[index], y: window.innerHeight - 46 },
              0,
              1,
            );
          });
        } else {
          const origin = mascotCenter();
          const now = performance.now();
          positions.forEach((_, index) => {
            const state = motion[index];
            setPosition(index, origin, 0, 1);
            state.heading = state.phaseOffset;
            state.speed = 0;
            state.pauseUntil = 0;
            state.lookUntil = 0;
            state.facing = 1;
            state.goal = wanderPoint(index, now);
          });
          phase = "entering";
          lastThemeStartedAt = now;
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
      stopWalking();
      sparkAnimations.forEach((animation) => animation.cancel());
      activeSparks.forEach((index) => sparkRefs.current[index]?.style.removeProperty("opacity"));
      activeSparks.clear();
      tapTimeouts.forEach(window.clearTimeout);
      root.classList.remove(
        "is-active",
        "is-entering",
        "is-returning",
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
          key={light.id}
          style={{ aspectRatio: `${light.size[0]} / ${light.size[1]}` }}
          ref={(element) => {
            beetleRefs.current[index] = element;
          }}
        >
          <span className="soot-light-aura" />
          <span className="soot-light-shadow" />
          <div
            className="soot-rig"
            style={{ aspectRatio: `${light.size[0]} / ${light.size[1]}` }}
            ref={(element) => {
              rigRefs.current[index] = element;
              element?.style.setProperty("--blink-duration", light.blinkDuration);
              element?.style.setProperty("--blink-delay", light.blinkDelay);
            }}
          >
            <img className="soot-rig-layer soot-rig-body" src={light.body} alt="" draggable="false" />
            {light.legs.map((leg, legIndex) => (
              <img
                className={`soot-rig-layer soot-rig-leg soot-rig-leg-${legIndex + 1}`}
                key={leg.src}
                src={leg.src}
                alt=""
                draggable="false"
                style={{ transformOrigin: `${leg.origin[0]}% ${leg.origin[1]}%` }}
              />
            ))}
            {light.eyes.map((eye, eyeIndex) => (
              <img
                className={`soot-rig-layer soot-rig-eye soot-rig-eye-${eyeIndex + 1}`}
                key={eye.src}
                src={eye.src}
                alt=""
                draggable="false"
                style={{ transformOrigin: `${eye.origin[0]}% ${eye.origin[1]}%` }}
              />
            ))}
          </div>
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
