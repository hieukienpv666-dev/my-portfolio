import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";

const sootSprites = [
  { left: "7%", top: "235px", delay: "-1s" },
  { left: "87%", top: "290px", delay: "-3s" },
  { left: "76%", top: "510px", delay: "-5s" },
  { left: "14%", top: "640px", delay: "-2s" },
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

    const resetSprites = () => {
      rootRef.current
        ?.querySelectorAll<HTMLElement>(".soot-sprite")
        .forEach((sprite) => {
          sprite.style.removeProperty("--soot-shift-x");
          sprite.style.removeProperty("--soot-shift-y");
        });
    };

    const onPointerMove = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || event.pointerType !== "mouse") {
        resetSprites();
        return;
      }

      const rootBounds = root.getBoundingClientRect();
      if (
        event.clientX < rootBounds.left ||
        event.clientX > rootBounds.right ||
        event.clientY < rootBounds.top ||
        event.clientY > rootBounds.bottom
      ) {
        resetSprites();
        return;
      }

      root.querySelectorAll<HTMLElement>(".soot-sprite").forEach((sprite) => {
        const bounds = sprite.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const deltaX = centerX - event.clientX;
        const deltaY = centerY - event.clientY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance > 150) {
          sprite.style.removeProperty("--soot-shift-x");
          sprite.style.removeProperty("--soot-shift-y");
          return;
        }

        const strength = ((150 - distance) / 150) * 62;
        const divisor = distance || 1;
        sprite.style.setProperty(
          "--soot-shift-x",
          `${(deltaX / divisor) * strength}px`,
        );
        sprite.style.setProperty(
          "--soot-shift-y",
          `${(deltaY / divisor) * strength}px`,
        );
      });
    };

    const syncPointer = () => {
      if (!finePointer.matches || reducedMotion.matches) {
        window.removeEventListener("pointermove", onPointerMove);
        resetSprites();
      } else {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
      }
    };

    syncPointer();
    finePointer.addEventListener("change", syncPointer);
    reducedMotion.addEventListener("change", syncPointer);
    return () => {
      finePointer.removeEventListener("change", syncPointer);
      reducedMotion.removeEventListener("change", syncPointer);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div className="soot-sprites" ref={rootRef} aria-hidden="true">
      {sootSprites.map((sprite, index) => (
        <span
          className={`soot-sprite soot-sprite-${index + 1}`}
          key={index}
          style={{
            left: sprite.left,
            top: sprite.top,
            "--soot-delay": sprite.delay,
          } as CSSProperties & Record<`--${string}`, string>}
        >
          <span className="soot-sprite-eyes" />
        </span>
      ))}
    </div>
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
