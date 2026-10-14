"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { canAnimate, gsap } from "./motion/gsap";

// "Even when you switch." in five languages. Each language takes its flag colour in CSS (`data-lang`).
const PHRASES = [
  { text: "Even when you switch.", lang: "en" },
  { text: "Даже при смене языка.", lang: "ru" },
  { text: "Тил алмашса да.", lang: "ky" },
  { text: "Тіл ауысса да.", lang: "kk" },
  { text: "언어를 바꿔도.", lang: "ko" },
] as const;

const FIRST_DELAY = 5000;
const HOLD = 5000;

// Words stay whole (they wrap as units); letters are separate so they can ripple one after another.
// `--p` is a letter's place along the phrase, used for the Korean red-to-blue blend.
const place = (position: number, total: number) => `${total > 1 ? (position / (total - 1)) * 100 : 0}%`;

function Letters({ text }: Readonly<{ text: string }>) {
  const words = text.split(" ");
  const total = text.replaceAll(" ", "").length;
  let position = 0;
  return <>{words.map((word, w) => (
    <Fragment key={w}>
      <span className="cs-word">{[...word].map((char, i) => <span className="cs-char" key={i} style={{ "--p": place(position++, total) } as CSSProperties}>{char}</span>)}</span>
      {w < words.length - 1 && " "}
    </Fragment>
  ))}</>;
}

/** The same markup as <Letters>, written by hand because the text changes outside React. */
function fill(node: HTMLElement, text: string) {
  const words = text.split(" ");
  const total = text.replaceAll(" ", "").length;
  let position = 0;
  node.replaceChildren();
  words.forEach((word, w) => {
    const wrap = document.createElement("span");
    wrap.className = "cs-word";
    for (const char of word) {
      const letter = document.createElement("span");
      letter.className = "cs-char";
      letter.style.setProperty("--p", place(position++, total));
      letter.textContent = char;
      wrap.append(letter);
    }
    node.append(wrap);
    if (w < words.length - 1) node.append(" ");
  });
}

const lettersOf = (node: HTMLElement) => Array.from(node.querySelectorAll(".cs-char"));

/**
 * The hero's italic phrase cycles through English, Russian, Kyrgyz, Kazakh and Korean. The letters lift
 * away left to right and the next phrase rises in behind them: one wave out, one wave in.
 * Screen readers get the static English phrase; the animated text is hidden from them.
 * The parent heading reserves its tallest state so nothing below it jumps.
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
        fill(node, phrase.text);
        tallest = Math.max(tallest, heading.offsetHeight);
      }
      fill(node, PHRASES[index].text);
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
      const target = PHRASES[to];
      morphing = true;
      container.classList.add("is-morphing");

      // 1. the current phrase lifts away, left to right
      tween = gsap.to(lettersOf(node), {
        yPercent: -42,
        opacity: 0,
        duration: 0.42,
        ease: "power2.in",
        stagger: { each: 0.02 },
        onComplete: () => {
          // 2. swap the text (and the colour with it); the new phrase rises in on the same wave
          container.dataset.lang = target.lang;
          node.lang = target.lang;
          fill(node, target.text);
          tween = gsap.fromTo(lettersOf(node), { yPercent: 42, opacity: 0 }, {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: { each: 0.03 },
            clearProps: "transform,opacity",
            onComplete: () => {
              index = to;
              morphing = false;
              container.classList.remove("is-morphing");
              schedule(HOLD);
            },
          });
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
      node.lang = "en";
      fill(node, PHRASES[0].text);
      if (heading) heading.style.minHeight = "";
    };
  }, []);

  return (
    <span className="code-switch" data-lang="en" ref={wrap}>
      <span className="sr-only">{PHRASES[0].text}</span>
      <span aria-hidden="true" lang="en" ref={visible}><Letters text={PHRASES[0].text} /></span>
    </span>
  );
}
