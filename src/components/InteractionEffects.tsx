import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const revealSelector = [
  "h1,.sky-wordmark",
  "h2",
  "h3",
  "p",
  ".calendar-card",
  ".archive-card",
  ".service-card",
  ".shop-showcase-shot",
  ".split > img",
  ".letter label",
  ".btn",
  ".round-link",
].join(",");

const interactiveCardSelector = ".archive-card,.service-card,.card";

function splitTitleIntoLetters(title: HTMLElement) {
  if (title.dataset.lettersReady) return;

  const label = title.innerText.replace(/\s+/g, " ").trim();
  if (!label) return;
  title.dataset.lettersReady = "true";
  title.setAttribute("aria-label", title.getAttribute("aria-label") ?? label);

  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    if (walker.currentNode.textContent?.trim()) {
      textNodes.push(walker.currentNode as Text);
    }
  }

  let letterIndex = 0;
  for (const textNode of textNodes) {
    const fragment = document.createDocumentFragment();
    const tokens = (textNode.textContent ?? "").match(/\s+|[^\s]+/g) ?? [];
    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        fragment.append(document.createTextNode(token));
        continue;
      }

      const word = document.createElement("span");
      word.className = "title-word";
      word.setAttribute("aria-hidden", "true");
      for (const character of Array.from(token)) {
        const letter = document.createElement("span");
        letter.className = "title-letter";
        letter.style.setProperty(
          "--letter-delay",
          `${Math.min(letterIndex, 32) * 24}ms`,
        );
        letter.textContent = character;
        word.append(letter);
        letterIndex += 1;
      }
      fragment.append(word);
    }
    textNode.replaceWith(fragment);
  }
}

export function InteractionEffects() {
  const location = useLocation();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("main.page");
    if (!root) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const revealedElements = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;
    let siblingIndexes = new WeakMap<Element, number>();

    const revealElement = (element: HTMLElement) => {
      if (element.matches("h1,.sky-wordmark")) splitTitleIntoLetters(element);
      element.classList.add("scroll-reveal");
      if (revealedElements.has(element)) return;
      revealedElements.add(element);

      const parent = element.parentElement;
      const index = parent ? siblingIndexes.get(parent) ?? 0 : 0;
      if (parent) siblingIndexes.set(parent, index + 1);
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index, 6) * 85}ms`,
      );

      if (motionPreference.matches) {
        element.classList.add("is-revealed");
      } else {
        observer?.observe(element);
      }
    };

    const scan = (node: ParentNode) => {
      if (node instanceof HTMLElement && node.matches(revealSelector)) {
        revealElement(node);
      }
      node.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
        const revealCard = element.matches(
          ".calendar-card,.archive-card,.service-card,.shop-showcase-shot",
        );
        if (
          !revealCard &&
          element.closest(
            ".calendar-card,.archive-card,.service-card,.shop-showcase-shot",
          )
        ) {
          if (!element.matches("h1,h2,h3")) return;
        }
        revealElement(element);
      });
    };

    const startObserver = () => {
      observer?.disconnect();
      siblingIndexes = new WeakMap();
      if (motionPreference.matches) {
        root.querySelectorAll<HTMLElement>(".scroll-reveal").forEach((element) => {
          element.classList.add("is-revealed");
        });
        return;
      }

      observer = new IntersectionObserver(
        (entries, currentObserver) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-revealed");
            currentObserver.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      root.querySelectorAll<HTMLElement>(".scroll-reveal").forEach((element) => {
        if (!element.classList.contains("is-revealed")) observer?.observe(element);
      });
    };

    scan(root);
    startObserver();

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node);
        });
      }
    });
    mutations.observe(root, { childList: true, subtree: true });

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || motionPreference.matches) return;
      const card = (event.target as HTMLElement).closest<HTMLElement>(
        interactiveCardSelector,
      );
      if (!card || !root.contains(card)) return;

      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--tilt-x", `${(0.5 - y) * 8}deg`);
      card.style.setProperty("--tilt-y", `${(x - 0.5) * 8}deg`);
      card.style.setProperty("--shine-x", `${x * 100}%`);
      card.style.setProperty("--shine-y", `${y * 100}%`);
      card.classList.add("is-pointer-over");
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const card = (event.target as HTMLElement).closest<HTMLElement>(
        interactiveCardSelector,
      );
      if (!card || card.contains(event.relatedTarget as Node | null)) return;
      card.classList.remove("is-pointer-over");
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    };

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        ".btn,.round-link,button[type='submit']",
      );
      if (!button || !root.contains(button) || motionPreference.matches) return;

      const bounds = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "interaction-ripple";
      ripple.style.left = `${event.clientX - bounds.left}px`;
      ripple.style.top = `${event.clientY - bounds.top}px`;
      button.append(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
      });
    };

    const onMotionPreferenceChange = () => startObserver();
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerout", onPointerOut);
    root.addEventListener("click", onClick);
    motionPreference.addEventListener("change", onMotionPreferenceChange);

    return () => {
      observer?.disconnect();
      mutations.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerout", onPointerOut);
      root.removeEventListener("click", onClick);
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
    };
  }, [location.pathname]);

  return null;
}
