import { useEffect, useRef } from "react";

const sootLights = [
  { soot: "/soot/soot-1.png", star: "/soot/star-pink.png" },
  { soot: "/soot/soot-2.png", star: "/soot/star-white.png" },
  { soot: "/soot/soot-3.png", star: "/soot/star-green.png" },
];

const starColors = ["#ff7aa8", "#d8f3ff", "#7dffb0"];
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
type Game = "chase" | "high-jump" | "toss" | "swap" | "roll" | "hide" | "dance";

export function SootLights() {
  const rootRef = useRef<HTMLDivElement>(null);
  const beetleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const shadowRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const playStarRefs = useRef<Array<HTMLImageElement | null>>([]);
  const sparkRefs = useRef<Array<HTMLImageElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const positions: Point[] = sootLights.map(() => ({ x: 0, y: 0 }));
    const starOrder = [0, 1, 2];
    const sparkAnimations = new Set<Animation>();
    const sparkTimeouts = new Set<number>();
    const tapTimeouts = sootLights.map(() => 0);
    const jumpUntil = sootLights.map(() => 0);
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
    let lastPointerAt = lastPointerMove;
    let previousPointer = { ...pointer };
    let hoveredCenter: Point | null = null;
    let hoveringMascot = false;
    let panicUntil = 0;
    let panicStartedAt = 0;
    let panicTargets: Point[] = [];
    let windX = 0;
    let windUntil = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let lastRectScan = 0;
    let obstacleRects: DOMRect[] = [];
    let nextGameAt = 0;
    let game: Game | null = null;
    let gameLead = 0;
    let gameStartedAt = 0;
    let gameEndsAt = 0;
    let gameDirection = 1;
    let nextDirectionChange = 0;
    let starsSwapped = false;

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
    const mascotCenter = (): Point => {
      const mascot = document.querySelector<HTMLElement>(".cat-mascot");
      if (!mascot) return { x: 42, y: window.innerHeight - 42 };
      const bounds = mascot.getBoundingClientRect();
      return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    };

    const clampPoint = (point: Point): Point => {
      const padding = 56;
      const width = window.innerWidth;
      const height = window.innerHeight;
      return {
        x: width < padding * 2 ? width / 2 : Math.max(padding, Math.min(width - padding, point.x)),
        y: height < padding * 2 ? height / 2 : Math.max(padding, Math.min(height - padding, point.y)),
      };
    };

    const scanObstacles = (now: number) => {
      if (now - lastRectScan < 500) return;
      lastRectScan = now;
      obstacleRects = Array.from(
        document.querySelectorAll<HTMLElement>(
          "a, button, input, textarea, h1, h2, .card, .project-card, .service-card, .archive-card, [role='button']",
        ),
      )
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden" &&
            bounds.width > 0 && bounds.height > 0 &&
            bounds.bottom > 0 && bounds.top < window.innerHeight &&
            bounds.right > 0 && bounds.left < window.innerWidth;
        })
        .map((element) => element.getBoundingClientRect());
    };

    const avoidObstacles = (point: Point) => {
      let safe = clampPoint(point);
      const padding = 56;
      obstacleRects.forEach((rect) => {
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
        safe = clampPoint(options.reduce((best, option) =>
          Math.hypot(option.x - safe.x, option.y - safe.y) <
          Math.hypot(best.x - safe.x, best.y - safe.y) ? option : best,
        ));
      });
      return safe;
    };

    const setStarColor = (index: number, colorIndex: number) => {
      const beetle = beetleRefs.current[index];
      const star = playStarRefs.current[index];
      if (!beetle || !star) return;
      beetle.style.setProperty("--soot-light-color", starColors[colorIndex]);
      star.src = sootLights[colorIndex].star;
    };

    const clearGameVisuals = () => {
      root.classList.remove(
        "is-game-chase",
        "is-game-high-jump",
        "is-game-toss",
        "is-game-swap",
        "is-game-roll",
        "is-game-hide",
        "is-game-dance",
      );
      beetleRefs.current.forEach((beetle) =>
        beetle?.classList.remove("is-peeking", "is-exchanging", "is-star-playing"),
      );
      playStarRefs.current.forEach((star) => {
        if (star) {
          star.style.opacity = "0";
          star.style.removeProperty("transform");
        }
      });
    };

    const setPosition = (
      index: number,
      point: Point,
      angle: number,
      flip: number,
      scaleX: number,
      scaleY: number,
      jumpHeight: number,
    ) => {
      positions[index] = point;
      const element = beetleRefs.current[index];
      if (element) {
        element.style.transform =
          `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) ` +
          `rotate(${angle}deg) scaleX(${flip}) scale(${scaleX}, ${scaleY})`;
      }
      const shadow = shadowRefs.current[index];
      if (shadow) {
        const heightRatio = Math.max(0, Math.min(1, jumpHeight / 86));
        shadow.style.opacity = `${0.42 - heightRatio * 0.25}`;
        shadow.style.transform =
          `translateX(-50%) scale(${1 - heightRatio * 0.42}, ${1 - heightRatio * 0.28})`;
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
      clearGameVisuals();
      root.classList.remove("is-active", "is-entering", "is-returning", "is-idle", "is-hovering");
    };

    const scheduleFrame = () => {
      if (!frameId && visible && (active || phase === "returning") && !reducedMotion.matches) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const nearestObstacleEdge = (point: Point): Point => {
      if (obstacleRects.length === 0) {
        return { x: Math.max(42, window.innerWidth - 44), y: Math.min(108, window.innerHeight - 44) };
      }
      const nearest = obstacleRects.reduce((best, rect) => {
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const bestCenter = { x: best.left + best.width / 2, y: best.top + best.height / 2 };
        return Math.hypot(center.x - point.x, center.y - point.y) <
          Math.hypot(bestCenter.x - point.x, bestCenter.y - point.y) ? rect : best;
      });
      const center = { x: nearest.left + nearest.width / 2, y: nearest.top + nearest.height / 2 };
      if (Math.abs(point.x - center.x) > Math.abs(point.y - center.y)) {
        return {
          x: point.x < center.x ? nearest.left - 20 : nearest.right + 20,
          y: Math.max(nearest.top + 10, Math.min(nearest.bottom - 10, center.y)),
        };
      }
      return {
        x: Math.max(nearest.left + 10, Math.min(nearest.right - 10, center.x)),
        y: point.y < center.y ? nearest.top - 20 : nearest.bottom + 20,
      };
    };

    const startGame = (now: number) => {
      const games: Game[] = ["chase", "high-jump", "toss", "swap", "roll", "hide", "dance"];
      game = games[Math.floor(Math.random() * games.length)];
      gameLead = Math.floor(Math.random() * sootLights.length);
      gameStartedAt = now;
      gameEndsAt = now + (game === "dance" ? 3000 : randomBetween(2400, 3300));
      gameDirection = Math.random() < 0.5 ? -1 : 1;
      nextDirectionChange = now + randomBetween(420, 820);
      starsSwapped = false;
      clearGameVisuals();
      root.classList.add(`is-game-${game}`);
      if (game === "swap") {
        beetleRefs.current[gameLead]?.classList.add("is-exchanging");
        beetleRefs.current[(gameLead + 1) % sootLights.length]?.classList.add("is-exchanging");
      }
      if (game === "toss") beetleRefs.current[gameLead]?.classList.add("is-star-playing");
      if (game === "hide") beetleRefs.current[gameLead]?.classList.add("is-peeking");
    };

    function animate(now: number) {
      const currentRoot = rootRef.current;
      if (!currentRoot) return;
      frameId = 0;
      if (!visible || (!active && phase !== "returning")) return;
      if (reducedMotion.matches) return;

      const entering = phase === "entering";
      const returning = phase === "returning";
      const transitionProgress = Math.min(1, (now - transitionStartedAt) / 700);
      const easedProgress = 1 - (1 - transitionProgress) ** 3;
      const mobile = !finePointer.matches;
      const idle = mobile || now - lastPointerMove > 1500;
      currentRoot.classList.toggle("is-idle", idle);
      currentRoot.classList.toggle("is-hovering", hoveredCenter !== null && !idle);
      scanObstacles(now);

      if (!mobile && idle && !hoveringMascot && !game && now >= nextGameAt) {
        startGame(now);
      } else if (game && (!idle || now >= gameEndsAt)) {
        game = null;
        clearGameVisuals();
        nextGameAt = Math.max(now, gameStartedAt + randomBetween(3000, 6000));
      }
      if (game === "chase" && now >= nextDirectionChange) {
        gameDirection *= -1;
        nextDirectionChange = now + randomBetween(380, 780);
      }

      const gameProgress = game
        ? Math.max(0, Math.min(1, (now - gameStartedAt) / (gameEndsAt - gameStartedAt)))
        : 0;
      const center = hoveringMascot ? mascotCenter() : hoveredCenter && !idle ? hoveredCenter : pointer;
      const mascot = hoveringMascot ? mascotCenter() : null;
      const leadPartner = (gameLead + 1) % sootLights.length;

      sootLights.forEach((_, index) => {
        const previous = positions[index];
        const offset = followerOffsets[index];
        let target: Point;
        if (returning) {
          target = mascotCenter();
        } else if (mobile) {
          target = {
            x: window.innerWidth * mobileAnchors[index],
            y: window.innerHeight - 46,
          };
        } else if (hoveringMascot && mascot) {
          const orbit = now / 360 + (index * Math.PI * 2) / sootLights.length;
          target = { x: mascot.x + Math.cos(orbit) * 76, y: mascot.y + Math.sin(orbit) * 58 };
        } else if (idle) {
          const orbit = (index / sootLights.length) * Math.PI * 2 - Math.PI / 2;
          target = { x: center.x + Math.cos(orbit) * 44, y: center.y + Math.sin(orbit) * 30 };
        } else {
          target = { x: center.x - offset.x, y: center.y - offset.y };
        }

        let extraY = 0;
        let extraRotation = 0;
        let gameActive = false;
        let jumpStrength = 0;

        if (hoveringMascot) {
          extraY = -14 * Math.max(0, Math.sin(now / 145 + index * 2));
          jumpStrength = 0.75;
        }

        if (game) {
          gameActive = true;
          if (game === "chase") {
            const orbit = now / 280 * gameDirection + (index === gameLead ? 0 : Math.PI);
            if (index === gameLead || index === leadPartner) {
              target = { x: center.x + Math.cos(orbit) * 56, y: center.y + Math.sin(orbit) * 42 };
            } else {
              const zigzag = Math.sin(now / 95) * 42;
              target = {
                x: center.x + Math.cos(orbit + Math.PI) * 104 + zigzag,
                y: center.y + Math.sin(orbit + Math.PI) * 76 - Math.abs(zigzag) * 0.25,
              };
            }
          } else if (game === "high-jump" && index === gameLead) {
            extraY = -80 * Math.sin(Math.PI * gameProgress);
            extraRotation = 360 * gameProgress;
            jumpStrength = Math.abs(Math.cos(Math.PI * gameProgress));
          } else if (game === "toss" && index === gameLead) {
            const arc = Math.sin(Math.PI * gameProgress);
            const star = playStarRefs.current[index];
            if (star) {
              star.style.opacity = `${Math.max(0, Math.min(1, arc * 1.8))}`;
              star.style.transform =
                `translate(-50%, -50%) translate(${Math.sin(gameProgress * Math.PI * 2) * 30}px, ${-90 * arc}px) ` +
                `rotate(${gameProgress * 540}deg) scale(${0.7 + arc * 0.3})`;
            }
            extraY = gameProgress > 0.72 ? -28 * Math.sin(Math.PI * ((gameProgress - 0.72) / 0.28)) : 0;
            jumpStrength = gameProgress > 0.72 ? 1 : arc * 0.35;
          } else if (game === "swap") {
            const other = index === gameLead || index === leadPartner;
            if (other) {
              const separation = 72 * (1 - Math.min(1, Math.max(0, (gameProgress - 0.18) / 0.42)));
              const side = index === gameLead ? -1 : 1;
              target = { x: center.x + side * separation, y: center.y - 10 };
              if (!starsSwapped && gameProgress >= 0.5) {
                const first = starOrder[gameLead];
                starOrder[gameLead] = starOrder[leadPartner];
                starOrder[leadPartner] = first;
                setStarColor(gameLead, starOrder[gameLead]);
                setStarColor(leadPartner, starOrder[leadPartner]);
                starsSwapped = true;
              }
              jumpStrength = gameProgress > 0.55 ? 0.45 : 0;
            }
          } else if (game === "roll" && index === gameLead) {
            target = { x: center.x + (gameProgress - 0.5) * 150, y: center.y + 8 };
            extraRotation = gameProgress * 720 * gameDirection;
            jumpStrength = gameProgress < 0.18 || gameProgress > 0.84 ? 0.6 : 0;
          } else if (game === "hide" && index === gameLead) {
            target = nearestObstacleEdge(center);
            if (Math.hypot(pointer.x - previous.x, pointer.y - previous.y) < 110) {
              extraY = -38 * Math.sin(Math.PI * gameProgress);
            }
          } else if (game === "dance") {
            target = {
              x: center.x + (index - 1) * 54,
              y: center.y - 14 + Math.sin(gameProgress * Math.PI * 6) * 18,
            };
            jumpStrength = 0.9;
          }
        }

        if (now < jumpUntil[index]) {
          const jumpProgress = 1 - (jumpUntil[index] - now) / 460;
          extraY -= 58 * Math.sin(Math.PI * jumpProgress);
          jumpStrength = Math.max(jumpStrength, Math.abs(Math.cos(Math.PI * jumpProgress)));
        }

        if (!mobile && now < panicUntil) {
          const panicProgress = Math.min(1, (now - panicStartedAt) / 520);
          if (now < panicStartedAt + 520) {
            target = panicTargets[index];
          } else {
            const base = hoveredCenter && !idle ? hoveredCenter : pointer;
            const returningTarget = { x: base.x - offset.x, y: base.y - offset.y };
            target = {
              x: panicTargets[index].x + (returningTarget.x - panicTargets[index].x) *
                Math.min(1, (panicProgress - 0.5) * 2),
              y: panicTargets[index].y + (returningTarget.y - panicTargets[index].y) *
                Math.min(1, (panicProgress - 0.5) * 2),
            };
          }
          gameActive = true;
          jumpStrength = Math.max(jumpStrength, panicProgress < 0.45 ? 1 : 0.25);
        }

        if (!mobile && now < windUntil) {
          const wind = (windUntil - now) / 650;
          target = { x: target.x + windX * wind * 0.55, y: target.y + wind * 7 };
          extraRotation += Math.max(-12, Math.min(12, windX * 0.055));
        }

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
          : idle && !gameActive
            ? 0.025
            : index === 0 ? 0.08 : index === 1 ? 0.06 : 0.045;
        const next = {
          x: previous.x + (target.x - previous.x) * follow,
          y: previous.y + (target.y - previous.y) * follow,
        };
        const distance = Math.hypot(next.x - previous.x, next.y - previous.y);
        const running = mobile || gameActive || distance > 0.7;
        const speed = distance * 16;
        const jumpRate = Math.max(1.8, Math.min(8, 1.8 + speed * 0.1));
        const hopPhase = ((now / 1000 * jumpRate + index * 0.31) % 1 + 1) % 1;
        let squashX = 1;
        let squashY = 1;
        let hopY = extraY;
        if (!entering && !returning && running && !jumpStrength) {
          if (hopPhase < 0.13) {
            squashX = 1 + 0.15 * (hopPhase / 0.13);
            squashY = 1 - 0.2 * (hopPhase / 0.13);
          } else if (hopPhase < 0.45) {
            const flight = (hopPhase - 0.13) / 0.32;
            squashX = 1.15 - flight * 0.25;
            squashY = 0.8 + flight * 0.4;
            hopY -= Math.sin(flight * Math.PI) * (18 + Math.min(speed, 30) * 0.48);
          } else if (hopPhase < 0.61) {
            const land = (hopPhase - 0.45) / 0.16;
            squashX = 0.9 + land * 0.25;
            squashY = 1.2 - land * 0.4;
          }
        } else if (mobile && !running) {
          hopY -= 10 * Math.max(0, Math.sin(now / 820 + index * 1.7));
        }

        const stepShake = running && !entering && !returning
          ? Math.sin(now / 1000 * Math.PI * 24 + index * 1.8) * 3
          : 0;
        const stepScale = running && !entering && !returning
          ? 1 - Math.abs(Math.sin(now / 1000 * Math.PI * 24 + index * 1.8)) * 0.04
          : 1;
        const breathing = !running
          ? Math.sin(now / 610 + index * 2.1) * 1.8
          : 0;
        const lookAround = idle && !game && !mobile
          ? Math.sin(now / 710 + index * 2.4) * 5 +
            (now % 7200 > 5200 && now % 7200 < 5900
              ? Math.sin(now / 48 + index) * 7
              : 0)
          : 0;
        const bodyAngle = game === "high-jump" && index === gameLead
          ? 0
          : distance > 0.8
            ? Math.max(-18, Math.min(18, (next.x - previous.x) * 2.2))
            : lookAround;
        const direction = next.x < previous.x - 0.25 ? -1 : next.x > previous.x + 0.25 ? 1 : 0;
        const lastFlip = beetleRefs.current[index]?.dataset.direction === "-1" ? -1 : 1;
        const flip = direction === 0 ? lastFlip : direction;
        if (beetleRefs.current[index] && direction !== 0) {
          beetleRefs.current[index]!.dataset.direction = String(direction);
        }

        const point = avoidObstacles({ x: next.x, y: next.y + hopY + breathing });
        const rotation = bodyAngle + stepShake + extraRotation;
        const overallScaleX = squashX * (jumpStrength ? 0.96 : 1);
        const overallScaleY = squashY * stepScale * (jumpStrength ? 1.12 : 1);
        setPosition(index, point, rotation, flip, overallScaleX, overallScaleY, -hopY);
      });

      if (entering && transitionProgress >= 1) {
        phase = "active";
        currentRoot.classList.remove("is-entering");
      } else if (returning && transitionProgress >= 1) {
        hide();
        return;
      }

      scheduleFrame();
    }

    const beginTheme = (isDark: boolean) => {
      const currentRoot = rootRef.current;
      if (!currentRoot) return;
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
        game = null;
        clearGameVisuals();
        currentRoot.classList.remove("is-entering", "is-idle", "is-hovering");
        currentRoot.classList.add("is-active", "is-returning");
        transitionFrom = positions.map((point) => ({ ...point }));
        transitionStartedAt = performance.now();
        scheduleFrame();
        return;
      }

      if (active && phase !== "returning") return;
      active = true;
      phase = "active";
      currentRoot.classList.remove("is-returning", "is-entering");
      currentRoot.classList.add("is-active");
      currentRoot.classList.toggle("is-mobile", !finePointer.matches);
      currentRoot.classList.toggle("is-reduced-motion", reducedMotion.matches);

      if (reducedMotion.matches) {
        stopFrame();
        return;
      }

      if (!finePointer.matches) {
        positions.forEach((_, index) => {
          const point = {
            x: window.innerWidth * mobileAnchors[index],
            y: window.innerHeight - 46,
          };
          setPosition(index, point, 0, 1, 1, 1, 0);
        });
        scheduleFrame();
        return;
      }

      const origin = mascotCenter();
      positions.forEach((_, index) => setPosition(index, origin, 0, 1, 1, 1, 0));
      transitionFrom = positions.map((point) => ({ ...point }));
      phase = "entering";
      transitionStartedAt = performance.now();
      currentRoot.classList.add("is-entering");
      scheduleFrame();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !active || !finePointer.matches || reducedMotion.matches) return;
      const now = performance.now();
      const elapsed = Math.max(1, now - lastPointerAt);
      const movement = Math.hypot(event.clientX - previousPointer.x, event.clientY - previousPointer.y);
      const speed = movement / elapsed;
      pointer = { x: event.clientX, y: event.clientY };
      pointerSeen = true;
      if (movement > 0) {
        lastPointerMove = now;
        game = null;
        clearGameVisuals();
      }

      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(
            ".cat-mascot, a, button, .card, .project-card, .service-card, .archive-card, [role='button']",
          )
        : null;
      hoveringMascot = target?.matches(".cat-mascot") ?? false;
      if (hoveringMascot) {
        hoveredCenter = mascotCenter();
      } else if (target) {
        const bounds = target.getBoundingClientRect();
        hoveredCenter = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      } else {
        hoveredCenter = null;
      }

      if (speed > 1.1 && !hoveringMascot) {
        const nearestIndex = positions.reduce((best, point, index) =>
          Math.hypot(point.x - pointer.x, point.y - pointer.y) <
          Math.hypot(positions[best].x - pointer.x, positions[best].y - pointer.y)
            ? index
            : best,
        0);
        const nearest = positions[nearestIndex];
        const towardX = nearest.x - previousPointer.x;
        const towardY = nearest.y - previousPointer.y;
        const moveX = pointer.x - previousPointer.x;
        const moveY = pointer.y - previousPointer.y;
        const approaching = moveX * towardX + moveY * towardY > 0;
        if (approaching && Math.hypot(nearest.x - pointer.x, nearest.y - pointer.y) < 250) {
          panicStartedAt = now;
          panicUntil = now + 1000;
          panicTargets = positions.map((point, index) => {
            const angle = Math.atan2(point.y - pointer.y, point.x - pointer.x) + (index - 1) * 0.6;
            return clampPoint({ x: point.x + Math.cos(angle) * 118, y: point.y + Math.sin(angle) * 92 });
          });
        }
      }
      previousPointer = { x: event.clientX, y: event.clientY };
      lastPointerAt = now;
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

      sootLights.forEach((_, index) => {
        if (index !== nearest) jumpUntil[index] = performance.now() + 460;
      });
      const origin = currentPositions[nearest];
      const freeSparks = sparkRefs.current
        .map((element, index) => ({ element, index }))
        .filter(({ index }) => !sparkTimeouts.has(index));
      const count = Math.min(3, 8 - activeSparks, freeSparks.length);

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
        spark.element.src = sootLights[starOrder[nearest]].star;
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

    const onScroll = () => {
      const now = performance.now();
      const elapsed = Math.max(1, now - lastScrollAt);
      const difference = window.scrollY - lastScrollY;
      const speed = difference / elapsed;
      if (Math.abs(speed) > 0.45) {
        windX = Math.max(-180, Math.min(180, speed * 120));
        windUntil = now + 650;
      }
      lastScrollY = window.scrollY;
      lastScrollAt = now;
      lastRectScan = 0;
    };

    const onVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      if (!visible) stopFrame();
      else scheduleFrame();
    };

    const onResize = () => {
      lastRectScan = 0;
    };

    const syncMotionSettings = () => {
      root.classList.toggle("is-mobile", !finePointer.matches);
      root.classList.toggle("is-reduced-motion", reducedMotion.matches);
      if (reducedMotion.matches) {
        stopFrame();
        clearGameVisuals();
        beetleRefs.current.forEach((beetle) => beetle?.style.removeProperty("transform"));
        return;
      }
      if (!finePointer.matches) {
        positions.forEach((_, index) => {
          setPosition(index, {
            x: window.innerWidth * mobileAnchors[index],
            y: window.innerHeight - 46,
          }, 0, 1, 1, 1, 0);
        });
      } else if (phase === "active") {
        const center = pointerSeen ? pointer : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        positions.forEach((_, index) => {
          const offset = followerOffsets[index];
          setPosition(index, { x: center.x - offset.x, y: center.y - offset.y }, 0, 1, 1, 1, 0);
        });
      }
      scheduleFrame();
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
    document.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", onResize);
    beginTheme(document.documentElement.dataset.theme === "dark");

    return () => {
      themeObserver.disconnect();
      finePointer.removeEventListener("change", syncMotionSettings);
      reducedMotion.removeEventListener("change", syncMotionSettings);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
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
          <span
            className="soot-light-shadow"
            ref={(element) => {
              shadowRefs.current[index] = element;
            }}
          />
          <img src={light.soot} alt="" draggable="false" />
          <span className="soot-light-eyes" />
          <img
            className="soot-light-play-star"
            src={light.star}
            alt=""
            draggable="false"
            ref={(element) => {
              playStarRefs.current[index] = element;
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
