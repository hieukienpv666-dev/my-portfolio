import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const sootSprites = [
  { delay: "-1s", driftDuration: "4.8s" },
  { delay: "-3s", driftDuration: "5.15s" },
  { delay: "-5s", driftDuration: "5.5s" },
  { delay: "-2s", driftDuration: "5.85s" },
];

const celebrationBits = Array.from({ length: 10 }, (_, index) => ({
  symbol: index % 2 === 0 ? "✦" : "✿",
  angle: `${index * 36}deg`,
  distance: `${48 + (index % 3) * 18}px`,
  delay: `${(index % 4) * 45}ms`,
}));

type Point = { x: number; y: number };
type FlightCurve = { start: Point; controlOne: Point; controlTwo: Point; end: Point };

type ActiveFlight = {
  animation: Animation;
  trailAnimation: Animation;
  curve: FlightCurve;
  duration: number;
  startedAt: number;
  startScale: number;
};

function createFlightCurve(start: Point, end: Point): FlightCurve {
  const deltaX = end.x - start.x;
  const lift = Math.max(90, Math.min(300, Math.hypot(deltaX, end.y - start.y) * 0.32 + 70));
  const apex = Math.min(start.y, end.y) - lift;

  return {
    start,
    controlOne: { x: start.x + deltaX * 0.28, y: apex },
    controlTwo: { x: start.x + deltaX * 0.76, y: apex + lift * 0.45 },
    end,
  };
}

function pointOnCurve(curve: FlightCurve, progress: number): Point {
  const inverse = 1 - progress;
  const a = inverse ** 3;
  const b = 3 * inverse ** 2 * progress;
  const c = 3 * inverse * progress ** 2;
  const d = progress ** 3;

  return {
    x:
      a * curve.start.x +
      b * curve.controlOne.x +
      c * curve.controlTwo.x +
      d * curve.end.x,
    y:
      a * curve.start.y +
      b * curve.controlOne.y +
      c * curve.controlTwo.y +
      d * curve.end.y,
  };
}

function angleOnCurve(curve: FlightCurve, progress: number): number {
  const inverse = 1 - progress;
  const x =
    3 * inverse ** 2 * (curve.controlOne.x - curve.start.x) +
    6 * inverse * progress * (curve.controlTwo.x - curve.controlOne.x) +
    3 * progress ** 2 * (curve.end.x - curve.controlTwo.x);
  const y =
    3 * inverse ** 2 * (curve.controlOne.y - curve.start.y) +
    6 * inverse * progress * (curve.controlTwo.y - curve.controlOne.y) +
    3 * progress ** 2 * (curve.end.y - curve.controlTwo.y);

  return (Math.atan2(y, x) * 180) / Math.PI;
}

function flightPathData(curve: FlightCurve): string {
  return `M ${curve.start.x} ${curve.start.y} C ${curve.controlOne.x} ${curve.controlOne.y}, ${curve.controlTwo.x} ${curve.controlTwo.y}, ${curve.end.x} ${curve.end.y}`;
}

function SootSprites() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const root = rootRef.current;
    if (!root) return;

    type SpriteState = {
      element: HTMLElement;
      originX: number;
      originY: number;
      x: number;
      y: number;
      repelled: boolean;
    };

    let sprites: SpriteState[] = [];
    let pointer: { x: number; y: number } | null = null;
    let frameId = 0;
    let enabled = false;
    let visible = document.visibilityState === "visible";
    let frameBounds = root.getBoundingClientRect();

    const measureOrigins = () => {
      frameBounds = root.getBoundingClientRect();
      sprites = Array.from(root.querySelectorAll<HTMLElement>(".soot-sprite")).map(
        (element) => {
          const previous = sprites.find((sprite) => sprite.element === element);
          return {
            element,
            originX: frameBounds.left + element.offsetLeft,
            originY: frameBounds.top + element.offsetTop,
            x: previous?.x ?? 0,
            y: previous?.y ?? 0,
            repelled: previous?.repelled ?? false,
          };
        },
      );
    };

    const animate = () => {
      frameId = 0;
      if (!enabled || !visible) return;

      const pointerIsInside =
        pointer !== null &&
        pointer.x >= frameBounds.left &&
        pointer.x <= frameBounds.right &&
        pointer.y >= frameBounds.top &&
        pointer.y <= frameBounds.bottom;
      let moving = false;

      for (const sprite of sprites) {
        let targetX = 0;
        let targetY = 0;

        if (pointerIsInside && pointer) {
          const deltaX = sprite.originX - pointer.x;
          const deltaY = sprite.originY - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);
          const directionX =
            distance > 0
              ? deltaX / distance
              : sprite.originX < window.innerWidth / 2
                ? -1
                : 1;
          const directionY = distance > 0 ? deltaY / distance : -0.25;

          if (distance < 140) sprite.repelled = true;
          else if (distance > 160) sprite.repelled = false;

          if (sprite.repelled) {
            const strength = ((160 - Math.min(distance, 160)) / 160) * 56;
            targetX = directionX * strength;
            targetY = directionY * strength;
          }
        } else {
          sprite.repelled = false;
        }

        sprite.x += (targetX - sprite.x) * 0.12;
        sprite.y += (targetY - sprite.y) * 0.12;

        if (Math.abs(targetX - sprite.x) < 0.1) sprite.x = targetX;
        else moving = true;
        if (Math.abs(targetY - sprite.y) < 0.1) sprite.y = targetY;
        else moving = true;

        sprite.element.style.transform =
          `translate3d(${sprite.x}px, ${sprite.y}px, 0) translate(-50%, -50%)`;
      }

      if (moving) frameId = window.requestAnimationFrame(animate);
    };

    const scheduleAnimation = () => {
      if (enabled && visible && frameId === 0) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
      scheduleAnimation();
    };

    const onVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      if (!visible) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        scheduleAnimation();
      }
    };

    const clearOffsets = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      for (const sprite of sprites) {
        sprite.x = 0;
        sprite.y = 0;
        sprite.repelled = false;
        sprite.element.style.transform = "translate3d(0, 0, 0) translate(-50%, -50%)";
      }
    };

    const syncPointer = () => {
      const shouldEnable = finePointer.matches && !reducedMotion.matches;
      if (shouldEnable === enabled) return;
      enabled = shouldEnable;
      if (enabled) {
        measureOrigins();
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("resize", measureOrigins);
        document.addEventListener("visibilitychange", onVisibilityChange);
        scheduleAnimation();
      } else {
        pointer = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", measureOrigins);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        clearOffsets();
      }
    };

    measureOrigins();
    syncPointer();
    finePointer.addEventListener("change", syncPointer);
    reducedMotion.addEventListener("change", syncPointer);
    return () => {
      finePointer.removeEventListener("change", syncPointer);
      reducedMotion.removeEventListener("change", syncPointer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", measureOrigins);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return createPortal(
    <div className="soot-sprites" ref={rootRef} aria-hidden="true">
      {sootSprites.map((sprite, index) => (
        <span
          className={`soot-sprite soot-sprite-${index + 1}`}
          key={index}
          style={{
            "--soot-delay": sprite.delay,
            "--soot-drift-duration": sprite.driftDuration,
          } as CSSProperties & Record<`--${string}`, string>}
        >
          <span className="soot-sprite-float">
            <span className="soot-sprite-eyes" />
          </span>
        </span>
      ))}
    </div>,
    document.body,
  );
}

export function Contact() {
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [paperFolded, setPaperFolded] = useState(false);
  const [planeReady, setPlaneReady] = useState(false);
  const [planeWinding, setPlaneWinding] = useState(false);
  const [planePosition, setPlanePosition] = useState<Point | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const formRef = useRef<HTMLFormElement>(null);
  const mailLinkRef = useRef<HTMLAnchorElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const timersRef = useRef(new Set<number>());
  const animationsRef = useRef(new Set<Animation>());
  const mountedRef = useRef(false);
  const isSendingRef = useRef(false);
  const sentRef = useRef(false);
  const stageRef = useRef<"folding" | "scrolling" | "windup" | "flight" | "arrival">("folding");
  const activeFlightRef = useRef<ActiveFlight | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const planePositionRef = useRef<Point | null>(null);

  const schedule = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      if (mountedRef.current) callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  };

  const trackAnimation = (animation: Animation) => {
    animationsRef.current.add(animation);
    const remove = () => animationsRef.current.delete(animation);
    animation.addEventListener("finish", remove, { once: true });
    animation.addEventListener("cancel", remove, { once: true });
    return animation;
  };

  const setPlanePoint = (point: Point) => {
    planePositionRef.current = point;
    setPlanePosition(point);
  };

  const finishImmediately = () => {
    if (!mountedRef.current) return;
    if (resizeHandlerRef.current) {
      window.removeEventListener("resize", resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }
    activeFlightRef.current = null;
    for (const animation of animationsRef.current) animation.cancel();
    animationsRef.current.clear();
    isSendingRef.current = false;
    sentRef.current = true;
    setIsSending(false);
    setSent(true);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current.clear();
      for (const animation of animationsRef.current) animation.cancel();
      animationsRef.current.clear();
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      mailLinkRef.current?.classList.remove("paper-mail-receiving");
    };
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSendingRef.current || sentRef.current) return;

    const currentForm = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=hieukienpv999@gmail.com&su=${subject}&body=${body}`,
      "_blank",
      "noopener,noreferrer",
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sentRef.current = true;
      setSent(true);
      return;
    }

    const formBounds = currentForm.getBoundingClientRect();
    const startPoint = {
      x: formBounds.left + formBounds.width / 2,
      y: formBounds.top + formBounds.height / 2,
    };
    isSendingRef.current = true;
    stageRef.current = "folding";
    setPlanePoint(startPoint);
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setPaperFolded(false);
    setPlaneReady(false);
    setPlaneWinding(false);
    setIsSending(true);

    const findMailLink = () =>
      mailLinkRef.current ??
      document.querySelector<HTMLAnchorElement>('.contact .fineprint a[href^="mailto:"]');

    const getDestination = (): { point: Point; link: HTMLAnchorElement | null } => {
      const link = findMailLink();
      if (!link) {
        return { point: { x: window.innerWidth - 24, y: 24 }, link: null };
      }

      const bounds = link.getBoundingClientRect();
      return {
        point: { x: bounds.left + 5, y: bounds.top + bounds.height / 2 },
        link,
      };
    };

    const animateFlight = (
      start: Point,
      end: Point,
      duration: number,
      startScale = 1,
      startAngle?: number,
    ) => {
      const plane = planeRef.current;
      const trail = trailRef.current;
      if (!plane || !trail) {
        console.error("The contact paper-plane animation could not be rendered.");
        finishImmediately();
        return;
      }

      const curve = createFlightCurve(start, end);
      const keyframes = Array.from({ length: 25 }, (_, index) => {
        const progress = index / 24;
        const point = pointOnCurve(curve, progress);
        const angle =
          index === 0 && startAngle !== undefined
            ? startAngle
            : angleOnCurve(curve, progress);
        const scale = startScale + (0.3 - startScale) * progress;
        return {
          offset: progress,
          transform: `translate(${point.x}px, ${point.y}px) rotate(${angle}deg) scale(${scale})`,
          opacity: 1,
        };
      });

      trail.setAttribute("d", flightPathData(curve));
      const pathLength = trail.getTotalLength();
      trail.style.strokeDasharray = "3 9";
      trail.style.strokeDashoffset = `${pathLength}`;
      trail.style.opacity = "0.9";
      const trailAnimation = trackAnimation(
        trail.animate(
          [
            { strokeDashoffset: pathLength, opacity: 0.2 },
            { strokeDashoffset: 0, opacity: 0.9 },
          ],
          { duration, fill: "forwards", easing: "linear" },
        ),
      );
      const animation = trackAnimation(
        plane.animate(keyframes, { duration, fill: "forwards", easing: "linear" }),
      );
      activeFlightRef.current = {
        animation,
        trailAnimation,
        curve,
        duration,
        startedAt: performance.now(),
        startScale,
      };
      stageRef.current = "flight";
      return { animation, curve, trailAnimation };
    };

    const startArrival = () => {
      const plane = planeRef.current;
      const trail = trailRef.current;
      const flight = activeFlightRef.current;
      if (!plane || !trail || !flight) {
        console.error("The contact paper-plane could not reach its mail destination.");
        finishImmediately();
        return;
      }

      activeFlightRef.current = null;
      stageRef.current = "arrival";
      const { point, link } = getDestination();
      if (link) {
        link.classList.add("paper-mail-receiving");
        schedule(() => link.classList.remove("paper-mail-receiving"), 800);
      }

      const endAngle = angleOnCurve(flight.curve, 1);
      const arrivalAnimation = trackAnimation(
        plane.animate(
          [
            {
              transform: `translate(${flight.curve.end.x}px, ${flight.curve.end.y}px) rotate(${endAngle}deg) scale(0.3)`,
              opacity: 1,
            },
            {
              transform: `translate(${point.x + 5}px, ${point.y}px) rotate(${endAngle}deg) scale(0.015)`,
              opacity: 0,
            },
          ],
          { duration: 300, fill: "forwards", easing: "ease-in" },
        ),
      );
      trackAnimation(
        trail.animate(
          [{ opacity: 0.9 }, { opacity: 0 }],
          { duration: 300, fill: "forwards", easing: "ease-out" },
        ),
      );

      arrivalAnimation.addEventListener(
        "finish",
        () => {
          if (!mountedRef.current) return;
          if (resizeHandlerRef.current) {
            window.removeEventListener("resize", resizeHandlerRef.current);
            resizeHandlerRef.current = null;
          }
          activeFlightRef.current = null;
          isSendingRef.current = false;
          sentRef.current = true;
          setIsSending(false);
          setSent(true);
        },
        { once: true },
      );
    };

    const launch = () => {
      if (!mountedRef.current) return;
      const currentPoint = planePositionRef.current ?? startPoint;
      setPlanePoint(currentPoint);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setPlaneReady(true);
      setPlaneWinding(true);
      stageRef.current = "windup";

      schedule(() => {
        const destination = getDestination();
        const latestPoint = planePositionRef.current ?? currentPoint;
        const windingPoint = { x: latestPoint.x - 10, y: latestPoint.y + 8 };
        setPlaneWinding(false);
        const flight = animateFlight(
          windingPoint,
          destination.point,
          1200,
          1,
          -24,
        );
        if (flight) schedule(startArrival, 1200);
      }, 200);
    };

    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const flight = activeFlightRef.current;
      if (flight) {
        const plane = planeRef.current;
        if (!plane) return;
        const now = performance.now();
        const progress = Math.max(0, Math.min(1, (now - flight.startedAt) / flight.duration));
        const bounds = plane.getBoundingClientRect();
        const point = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
        const scale = flight.startScale + (0.3 - flight.startScale) * progress;
        const angle = angleOnCurve(flight.curve, progress);
        const duration = Math.max(1, flight.duration - (now - flight.startedAt));
        flight.animation.cancel();
        flight.trailAnimation.cancel();
        const destination = getDestination();
        animateFlight(point, destination.point, duration, scale, angle);
        return;
      }

      if (stageRef.current === "folding") {
        const bounds = formRef.current?.getBoundingClientRect();
        if (bounds) {
          setPlanePoint({
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          });
        }
      }
    };

    resizeHandlerRef.current = onResize;
    window.addEventListener("resize", onResize);

    schedule(() => setPaperFolded(true), 350);
    schedule(() => {
      const destination = getDestination();
      const rect = destination.link?.getBoundingClientRect();
      const isOutsideViewport =
        rect !== undefined &&
        (rect.top < 0 ||
          rect.bottom > window.innerHeight ||
          rect.left < 0 ||
          rect.right > window.innerWidth);

      if (!destination.link || !isOutsideViewport) {
        launch();
        return;
      }

      stageRef.current = "scrolling";
      destination.link.scrollIntoView({ behavior: "smooth", block: "center" });
      let previousTop = destination.link.getBoundingClientRect().top;
      let stableFrames = 0;
      const scrollDeadline = performance.now() + 1800;
      const waitForScroll = () => {
        if (!mountedRef.current) return;
        const nextTop = destination.link?.getBoundingClientRect().top ?? previousTop;
        stableFrames = Math.abs(nextTop - previousTop) < 0.5 ? stableFrames + 1 : 0;
        previousTop = nextTop;
        if (stableFrames >= 5 || performance.now() >= scrollDeadline) {
          launch();
          return;
        }
        schedule(waitForScroll, 100);
      };
      schedule(waitForScroll, 100);
    }, 700);
  }

  return (
    <section className="prose contact">
      <SootSprites />
      <p className="eyebrow">Contact / Available for work</p>
      <h1>Let’s make<br /><em>something memorable.</em></h1>
      <p className="lede">
        Have a project, collaboration or a wonderfully strange idea? Tell me about it.
      </p>
      {sent ? (
        <>
          <p className="thanks">
            Gmail đã mở trong tab mới. Bấm Gửi ở đó và lá thư sẽ bay tới tôi nhé ✉️
          </p>
          <div className="contact-celebration" aria-hidden="true">
            {celebrationBits.map((bit, index) => (
              <span
                key={index}
                style={{
                  "--celebration-angle": bit.angle,
                  "--celebration-distance": bit.distance,
                  "--celebration-delay": bit.delay,
                } as CSSProperties & Record<`--${string}`, string>}
              >
                {bit.symbol}
              </span>
            ))}
          </div>
        </>
      ) : (
        <form
          className={`letter${isSending ? " is-paper-folding" : ""}${paperFolded ? " is-paper-folded" : ""}`}
          onSubmit={onSubmit}
          ref={formRef}
          aria-disabled={isSending}
        >
          <label>
            Name
            <input name="name" type="text" required autoComplete="name" disabled={isSending} />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" disabled={isSending} />
          </label>
          <label>
            The work you have in mind
            <textarea name="message" rows={6} required disabled={isSending} />
          </label>
          <button className="btn" type="submit" disabled={isSending}>
            Send enquiry ↗
          </button>
        </form>
      )}
      <p className="fineprint">
        Prefer mail clients?{" "}
        <a href="mailto:hieukienpv999@gmail.com" ref={mailLinkRef}>
          hieukienpv999@gmail.com
          <span className="paper-mail-envelope" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path className="paper-mail-envelope-flap" d="m4 8 8 6 8-6" />
            </svg>
          </span>
        </a>
        {" · "}
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=hieukienpv999@gmail.com"
          target="_blank"
          rel="noreferrer"
        >
          Open Gmail
        </a>
      </p>
      <p className="fineprint">
        Phone: <a href="tel:+84962211979">0962211979</a>
      </p>
      {isSending && planePosition &&
        createPortal(
          <svg
            className="paper-plane-layer"
            viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            aria-hidden="true"
            focusable="false"
          >
            <path className="paper-plane-trail" ref={trailRef} d="" />
            <g
              className={`paper-plane-aircraft${planeWinding ? " is-winding" : ""}`}
              ref={planeRef}
              style={{
                "--plane-x": `${planePosition.x}px`,
                "--plane-y": `${planePosition.y}px`,
                opacity: planeReady ? 1 : 0,
              } as CSSProperties & Record<`--${string}`, string>}
            >
              <path className="paper-plane-body" d="M-48-30 52 0-48 30-24 0Z" />
              <path className="paper-plane-crease" d="M-48-30-24 0-48 30M-24 0 52 0" />
            </g>
          </svg>,
          document.body,
        )}
    </section>
  );
}
