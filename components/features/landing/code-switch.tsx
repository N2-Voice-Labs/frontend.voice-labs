"use client";

import { useEffect, useRef } from "react";
import { canAnimate, gsap } from "./motion/gsap";

// Both phrases are 21 characters so letters can settle in place while the line morphs.
const PHRASES = [
  { text: "Even when you switch.", lang: "en", glyphs: "abcdefghijklmnopqrstuvwxyz" },
  { text: "Даже при смене языка.", lang: "ru", glyphs: "абвгдежзиклмнопрстуфхцчшэюя" },
] as const;

const FIRST_DELAY = 5000;
const HOLD = 6000;
const MORPH_SECONDS = 1.2;

/**
 * The hero's italic phrase alternates between English and Russian, letter by letter.
 * Screen readers get the static English phrase; the animated text is hidden from them.
 * The parent heading reserves the taller of the two states so nothing below it jumps.
 */
export function CodeSwitch() {
  const wrap = useRef<HTMLSpanElement>(null);
  const visible = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = wrap.current;
    const node = visible.current;
    if (!container || !node || !canAnimate()) return;
    const heading = container.closest("h1");

    let index = 0;
    let timer = 0;
    let morphing = false;
    let tween: gsap.core.Tween | null = null;

    const reserveHeight = () => {
      if (!heading || morphing) return;
      heading.style.minHeight = "";
      let tallest = 0;
      for (const phrase of PHRASES) {
        node.textContent = phrase.text;
        tallest = Math.max(tallest, heading.offsetHeight);
      }
      node.textContent = PHRASES[index].text;
      heading.style.minHeight = `${tallest}px`;
    };

    // Only rewrite while the hero is actually on screen.
    let inView = true;
    const watcher = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }) : null;
    watcher?.observe(container);

    const schedule = (delay: number) => {
      timer = window.setTimeout(() => (document.hidden || !inView ? schedule(1000) : morph((index + 1) % PHRASES.length)), delay);
    };

    const morph = (to: number) => {
      const from = node.textContent ?? "";
      const target = PHRASES[to];
      const length = Math.max(from.length, target.text.length);
      const progress = { value: 0 };
      morphing = true;
      container.dataset.lang = target.lang;
      container.classList.add("is-morphing");

      tween = gsap.to(progress, {
        value: 1,
        duration: MORPH_SECONDS,
        ease: "none",
        onUpdate: () => {
          let out = "";
          for (let i = 0; i < length; i++) {
            const start = (i / length) * 0.65;
            const final = target.text[i] ?? " ";
            if (progress.value >= start + 0.3) out += final;
            else if (progress.value < start) out += from[i] ?? " ";
            else out += final === " " ? " " : target.glyphs[Math.floor(Math.random() * target.glyphs.length)];
          }
          node.textContent = out;
        },
        onComplete: () => {
          node.textContent = target.text;
          index = to;
          morphing = false;
          container.classList.remove("is-morphing");
          schedule(HOLD);
        },
      });
    };

    reserveHeight();
    void document.fonts?.ready.then(reserveHeight);
    let lastWidth = heading?.parentElement?.clientWidth ?? 0;
    const observer = new ResizeObserver(() => {
      const width = heading?.parentElement?.clientWidth ?? 0;
      if (width === lastWidth) return;
      lastWidth = width;
      reserveHeight();
    });
    if (heading?.parentElement) observer.observe(heading.parentElement);
    schedule(FIRST_DELAY);

    return () => {
      window.clearTimeout(timer);
      tween?.kill();
      observer.disconnect();
      watcher?.disconnect();
      container.classList.remove("is-morphing");
      container.dataset.lang = "en";
      node.textContent = PHRASES[0].text;
      if (heading) heading.style.minHeight = "";
    };
  }, []);

  return (
    <span className="code-switch" data-lang="en" ref={wrap}>
      <span className="sr-only">{PHRASES[0].text}</span>
      <span aria-hidden="true" ref={visible}>{PHRASES[0].text}</span>
    </span>
  );
}
