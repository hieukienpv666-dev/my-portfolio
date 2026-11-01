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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    setSent(true);
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
            Thank you. The wind has the letter now—I will write back soon.
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
        <form className="letter" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" type="text" required autoComplete="name" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            The work you have in mind
            <textarea name="message" rows={6} required />
          </label>
          <button className="btn" type="submit">
            Send enquiry ↗
          </button>
        </form>
      )}
      <p className="fineprint">
        Prefer mail clients?{" "}
        <a href="mailto:hieukienpv999@gmail.com">hieukienpv999@gmail.com</a>
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
    </section>
  );
}
