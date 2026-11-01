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
      ref={buttonRef}
      type="button"
      className={`cat-mascot${dark ? " is-dark" : ""}${blinking ? " is-blinking" : ""}`}
      onClick={handleClick}
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
        <rect className="cat-bg-red" width="736" height="736" fill="#a02b34" />
        <circle className="cat-bg-green" cx="368" cy="400" r="560" fill="#a1b486" />
        <image href="/cat-head.png" x="0" y="0" width="736" height="736" />
        <ellipse cx="395" cy="404" rx="13" ry="6" fill="#fff8f0" />

        <g className="cat-eyes">
          <g className="cat-eyes-sleepy" clipPath="url(#cat-lid-sleepy)">
            <ellipse cx="296" cy="355" rx="57" ry="57" fill="#fff" />
            <ellipse cx="472" cy="356" rx="49" ry="58" fill="#fff" />
            <ellipse cx="318" cy="364" rx="9" ry="15" fill="#111" />
            <ellipse cx="462" cy="364" rx="9" ry="15" fill="#111" />
          </g>
          <g className="cat-eyes-awake">
            <ellipse cx="296" cy="368" rx="53" ry="58" fill="#fff" />
            <ellipse cx="472" cy="370" rx="50" ry="58" fill="#fff" />
            <ellipse cx="319" cy="374" rx="11" ry="22" fill="#111" />
            <ellipse cx="457" cy="376" rx="11" ry="22" fill="#111" />
          </g>
        </g>
      </svg>
    </button>
  );
}
