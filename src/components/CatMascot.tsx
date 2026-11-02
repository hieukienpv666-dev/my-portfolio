import { useEffect, useRef, useState, type Ref } from "react";

type CatMascotProps = {
  dark: boolean;
  onToggle: () => void;
  disabled?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
};

export function CatMascot({
  dark,
  onToggle,
  disabled = false,
  buttonRef,
}: CatMascotProps) {
  const [blinking, setBlinking] = useState(false);
  const blinkTimeout = useRef<number | undefined>(undefined);
  const mascotRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mascot = mascotRef.current;
    if (!mascot) return;

    const root = document.documentElement;
    const pointerMedia = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, active: false };
    const center = { x: 0, y: 0 };
    const currentLook = { x: 0, y: 0 };
    let frameId: number | undefined;
    let idleTimeout: number | undefined;
    let randomBlinkTimeout: number | undefined;
    let randomBlinkEndTimeout: number | undefined;
    let wakeTimeout: number | undefined;
    let paused = false;
    let pointerActivityPending = false;

    const clearTimer = (timer: number | undefined) => {
      if (timer !== undefined) window.clearTimeout(timer);
    };

    const updateCenter = () => {
      const bounds = mascot.getBoundingClientRect();
      center.x = bounds.left + bounds.width / 2;
      center.y = bounds.top + bounds.height / 2;
    };

    const setLook = (x: number, y: number) => {
      mascot.style.setProperty("--look-x", `${x}`);
      mascot.style.setProperty("--look-y", `${y}`);
    };

    const stopTracking = () => {
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
        frameId = undefined;
      }
      currentLook.x = 0;
      currentLook.y = 0;
      setLook(0, 0);
      mascot.removeAttribute("data-looking");
      mascot.classList.remove("is-curious");
    };

    const trackingEnabled = () =>
      pointerMedia.matches && !reducedMotionMedia.matches && pointer.active;

    const animateLook = () => {
      frameId = undefined;
      if (pointerActivityPending) {
        pointerActivityPending = false;
        activity(false);
      }
      if (paused || mascot.classList.contains("is-sleeping") || !trackingEnabled()) {
        stopTracking();
        return;
      }

      mascot.setAttribute("data-looking", "");
      const deltaX = pointer.x - center.x;
      const deltaY = pointer.y - center.y;
      const distance = Math.hypot(deltaX, deltaY);
      mascot.classList.toggle("is-curious", distance < 260);

      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      const targetX = clamp(deltaX / 180);
      const targetY = clamp(deltaY / 180);

      currentLook.x += (targetX - currentLook.x) * 0.15;
      currentLook.y += (targetY - currentLook.y) * 0.15;
      setLook(currentLook.x, currentLook.y);

      if (
        Math.abs(targetX - currentLook.x) > 0.05 ||
        Math.abs(targetY - currentLook.y) > 0.05
      ) {
        frameId = window.requestAnimationFrame(animateLook);
      } else {
        currentLook.x = targetX;
        currentLook.y = targetY;
        setLook(targetX, targetY);
      }
    };

    const requestLookFrame = () => {
      if (frameId === undefined && !paused) {
        frameId = window.requestAnimationFrame(animateLook);
      }
    };

    const stopRandomBlink = () => {
      clearTimer(randomBlinkTimeout);
      clearTimer(randomBlinkEndTimeout);
      randomBlinkTimeout = undefined;
      randomBlinkEndTimeout = undefined;
      mascot.classList.remove("is-random-blinking");
    };

    const scheduleRandomBlink = () => {
      clearTimer(randomBlinkTimeout);
      randomBlinkTimeout = undefined;
      if (
        paused ||
        mascot.classList.contains("is-sleeping") ||
        reducedMotionMedia.matches ||
        document.hidden
      ) {
        return;
      }

      randomBlinkTimeout = window.setTimeout(() => {
        if (paused || mascot.classList.contains("is-sleeping")) return;
        mascot.classList.add("is-random-blinking");
        randomBlinkEndTimeout = window.setTimeout(() => {
          mascot.classList.remove("is-random-blinking");
          randomBlinkEndTimeout = undefined;
          scheduleRandomBlink();
        }, 180);
      }, 3000 + Math.random() * 4000);
    };

    const enterSleep = () => {
      clearTimer(idleTimeout);
      idleTimeout = undefined;
      if (paused) return;
      stopRandomBlink();
      stopTracking();
      mascot.classList.remove("is-waking");
      clearTimer(wakeTimeout);
      wakeTimeout = undefined;
      mascot.classList.add("is-sleeping");
    };

    const resetIdleTimer = () => {
      clearTimer(idleTimeout);
      idleTimeout = undefined;
      if (paused || document.hidden) return;
      idleTimeout = window.setTimeout(enterSleep, 25000);
    };

    const activity = (requestTracking = true) => {
      if (paused) return;
      if (mascot.classList.contains("is-sleeping")) {
        mascot.classList.remove("is-sleeping");
        if (!reducedMotionMedia.matches) {
          mascot.classList.add("is-waking");
          clearTimer(wakeTimeout);
          wakeTimeout = window.setTimeout(() => {
            mascot.classList.remove("is-waking");
            wakeTimeout = undefined;
          }, 300);
        }
      }
      resetIdleTimer();
      scheduleRandomBlink();
      if (requestTracking && trackingEnabled()) requestLookFrame();
    };

    const isPaused = () =>
      mascot.disabled ||
      mascot.classList.contains("is-blinking") ||
      root.classList.contains("theme-anticipating");

    const syncPausedState = () => {
      const nextPaused = isPaused();
      if (nextPaused === paused) return;
      paused = nextPaused;
      if (paused) {
        clearTimer(idleTimeout);
        idleTimeout = undefined;
        stopRandomBlink();
        stopTracking();
        mascot.classList.remove("is-waking");
        clearTimer(wakeTimeout);
        wakeTimeout = undefined;
        return;
      }

      if (document.hidden) {
        enterSleep();
      } else {
        resetIdleTimer();
        scheduleRandomBlink();
        if (trackingEnabled()) requestLookFrame();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerMedia.matches || event.pointerType !== "mouse") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      pointerActivityPending = true;
      if (trackingEnabled() && !paused) requestLookFrame();
    };

    const onActivity = () => activity();

    const onVisibilityChange = () => {
      if (document.hidden) {
        enterSleep();
      }
    };

    const onMotionPreferenceChange = () => {
      if (reducedMotionMedia.matches) {
        stopTracking();
        stopRandomBlink();
      } else if (!paused && !mascot.classList.contains("is-sleeping")) {
        scheduleRandomBlink();
        if (trackingEnabled()) requestLookFrame();
      }
    };

    updateCenter();

    const observer = new MutationObserver(syncPausedState);
    observer.observe(mascot, { attributes: true, attributeFilter: ["class", "disabled"] });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("keydown", onActivity, true);
    window.addEventListener("scroll", updateCenter, { passive: true, capture: true });
    window.addEventListener("scroll", onActivity, { passive: true, capture: true });
    window.addEventListener("touchstart", onActivity, { passive: true, capture: true });
    window.addEventListener("click", onActivity, true);
    window.addEventListener("resize", updateCenter, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    pointerMedia.addEventListener("change", onMotionPreferenceChange);
    reducedMotionMedia.addEventListener("change", onMotionPreferenceChange);
    syncPausedState();
    if (!paused) {
      if (document.hidden) enterSleep();
      else {
        resetIdleTimer();
        scheduleRandomBlink();
      }
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onActivity, true);
      window.removeEventListener("scroll", updateCenter, true);
      window.removeEventListener("scroll", onActivity, true);
      window.removeEventListener("touchstart", onActivity, true);
      window.removeEventListener("click", onActivity, true);
      window.removeEventListener("resize", updateCenter);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      pointerMedia.removeEventListener("change", onMotionPreferenceChange);
      reducedMotionMedia.removeEventListener("change", onMotionPreferenceChange);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      clearTimer(idleTimeout);
      clearTimer(randomBlinkTimeout);
      clearTimer(randomBlinkEndTimeout);
      clearTimer(wakeTimeout);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(blinkTimeout.current), []);

  function handleClick() {
    if (disabled) return;

    window.clearTimeout(blinkTimeout.current);
    setBlinking(true);
    blinkTimeout.current = window.setTimeout(() => setBlinking(false), 950);
    onToggle();
  }

  return (
    <button
      type="button"
      className={`cat-mascot${dark ? " is-dark" : ""}${blinking ? " is-blinking" : ""}`}
      onClick={handleClick}
      ref={(element) => {
        mascotRef.current = element;
        if (typeof buttonRef === "function") {
          buttonRef(element);
        } else if (buttonRef) {
          buttonRef.current = element;
        }
      }}
      aria-pressed={dark}
      aria-label={dark ? "Chuyển sang theme sáng" : "Chuyển sang theme tối"}
      disabled={disabled}
    >
      <svg viewBox="0 0 736 736" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="cat-lid-sleepy">
            <rect x="200" y="350" width="340" height="80" />
          </clipPath>
        </defs>
        <rect className="cat-bg-base" width="736" height="736" fill="#a1b486" />
        <circle className="cat-bg-iris" cx="368" cy="400" r="560" fill="#a02b34" />
        <g className="cat-head-tilt">
          <image href="/cat-head.png" x="0" y="0" width="736" height="736" />
          <ellipse cx="395" cy="404" rx="13" ry="6" fill="#fff8f0" />

          <g className="cat-eyelid">
            <g className="cat-eyes">
              <g className="cat-eyes-sleepy" clipPath="url(#cat-lid-sleepy)">
                <ellipse cx="296" cy="355" rx="57" ry="57" fill="#fff" />
                <ellipse cx="472" cy="356" rx="49" ry="58" fill="#fff" />
                <ellipse className="cat-pupil pupil-sleepy-l" cx="318" cy="364" rx="9" ry="15" fill="#111" />
                <ellipse className="cat-pupil pupil-sleepy-r" cx="462" cy="364" rx="9" ry="15" fill="#111" />
              </g>
              <g className="cat-eyes-awake">
                <ellipse cx="296" cy="368" rx="53" ry="58" fill="#fff" />
                <ellipse cx="472" cy="370" rx="50" ry="58" fill="#fff" />
                <ellipse className="cat-pupil pupil-awake-l" cx="319" cy="374" rx="11" ry="22" fill="#111" />
                <ellipse className="cat-pupil pupil-awake-r" cx="457" cy="376" rx="11" ry="22" fill="#111" />
              </g>
            </g>
          </g>
          <g className="cat-sleep-z" aria-hidden="true">
            <image className="cat-sleep-z-one" href="/cat-z-1.png" x="430" y="270" width="66" height="90" />
            <image className="cat-sleep-z-two" href="/cat-z-2.png" x="480" y="200" width="77" height="90" />
            <image className="cat-sleep-z-three" href="/cat-z-3.png" x="510" y="130" width="89" height="90" />
          </g>
        </g>
      </svg>
    </button>
  );
}
