import { useEffect, useRef } from "react";

export function Clouds() {
  const cloudsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    let frame = 0;
    let pointerX = window.innerWidth / 2;

    const updateParallax = () => {
      frame = 0;
      const offset = pointerX / window.innerWidth - 0.5;

      cloudsRef.current?.querySelectorAll<HTMLElement>(".cloud").forEach((cloud) => {
        const speed = Number(cloud.dataset.parallax ?? 0);
        cloud.style.setProperty("--parallax-x", `${offset * speed * -24}px`);
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX = event.clientX;
      if (frame) return;
      frame = requestAnimationFrame(updateParallax);
    };

    const syncPointerListener = () => {
      if (finePointer.matches && !reducedMotion.matches) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
      } else {
        window.removeEventListener("pointermove", onPointerMove);
        cancelAnimationFrame(frame);
        frame = 0;
        cloudsRef.current?.querySelectorAll<HTMLElement>(".cloud").forEach((cloud) => {
          cloud.style.removeProperty("--parallax-x");
        });
      }
    };

    syncPointerListener();
    finePointer.addEventListener("change", syncPointerListener);
    reducedMotion.addEventListener("change", syncPointerListener);

    return () => {
      finePointer.removeEventListener("change", syncPointerListener);
      reducedMotion.removeEventListener("change", syncPointerListener);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="clouds" aria-hidden="true" ref={cloudsRef}>
      <span className="cloud cloud-a" data-parallax="0.7" />
      <span className="cloud cloud-b" data-parallax="1.1" />
      <span className="cloud cloud-c" data-parallax="1.6" />
      <span className="cloud cloud-d" data-parallax="2.1" />
    </div>
  );
}
