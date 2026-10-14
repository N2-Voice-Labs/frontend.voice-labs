"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { SplitText } from "gsap/SplitText";
import { EASE_OUT, gsap, ScrollTrigger } from "./gsap";
import { registerSmoothScroll, scrollToElement } from "./scroll-controller";

const STEP_FROM = {
  up: { opacity: 0, y: 20 },
  fade: { opacity: 0 },
  scale: { opacity: 0, scale: 0.96, y: 20 },
} as const;
const STEP_GAP = 0.14;

const all = <T extends HTMLElement>(selector: string) => gsap.utils.toArray<T>(selector);

/**
 * The single owner of page-level motion. Server-rendered sections only carry data attributes:
 *   data-sequence             a section whose [data-step] children enter as ONE timeline, lowest step first;
 *                             equal steps enter together (lightly staggered). data-step-from="scale|fade".
 *   data-split                headline rises word by word out of a line mask (used on two headlines only)
 *   data-parallax="40"        symmetric drift while the section crosses the viewport
 *   data-parallax-exit="48"   drift down while the section scrolls away (first screen)
 *   data-scroll-fade          fades out over the first part of the section's exit
 *   data-count-to="3"         counts up once when visible (markup already holds the final value)
 *   data-ambient-depth="-90"  fixed background layer that drifts over the whole document
 */
export function LandingMotion() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".marketing-header");
    header?.setAttribute("data-scrolled", String(window.scrollY > 16));
    const headerTrigger = ScrollTrigger.create({
      start: 16,
      end: "max",
      onToggle: (self) => header?.setAttribute("data-scrolled", String(self.isActive)),
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    void document.fonts?.ready.then(refresh);

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cleanups: Array<() => void> = [];

      // Smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis share one clock.
      const lenis = new Lenis({ lerp: 0.1, autoRaf: false });
      const tick = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      registerSmoothScroll(lenis);

      const onAnchorClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
        const id = link?.getAttribute("href")?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!id || !target) return;
        event.preventDefault();
        scrollToElement(target);
        history.replaceState(null, "", `#${id}`);
      };
      document.addEventListener("click", onAnchorClick);

      cleanups.push(() => {
        document.removeEventListener("click", onAnchorClick);
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        registerSmoothScroll(null);
        lenis.destroy();
      });

      // Entrances: each section is one timeline. Steps run in order (visual, headline, support, secondary)
      // instead of every element fading in on its own trigger.
      all("[data-sequence]").forEach((section) => {
        const steps = new Map<number, HTMLElement[]>();
        section.querySelectorAll<HTMLElement>("[data-step]").forEach((element) => {
          const step = Number(element.dataset.step) || 0;
          steps.set(step, [...(steps.get(step) ?? []), element]);
        });
        if (!steps.size) return;
        const timeline = gsap.timeline({
          defaults: { duration: 0.8, ease: EASE_OUT },
          scrollTrigger: { trigger: section, start: "top 72%", once: true },
        });
        [...steps.entries()].sort(([a], [b]) => a - b).forEach(([, elements], order) => {
          elements.forEach((element, index) => {
            const from = STEP_FROM[element.dataset.stepFrom as keyof typeof STEP_FROM] ?? STEP_FROM.up;
            timeline.from(element, { ...from, clearProps: "opacity,transform,visibility" }, order * STEP_GAP + index * 0.08);
          });
        });
      });

      // Counters count once; the server markup already holds the final number.
      all("[data-count-to]").forEach((element) => {
        const target = Number(element.dataset.countTo);
        if (!Number.isFinite(target)) return;
        const finalText = element.textContent ?? String(target);
        const state = { value: 0 };
        element.textContent = "0";
        cleanups.push(() => { element.textContent = finalText; });
        gsap.to(state, {
          value: target,
          duration: 1.6,
          ease: "power3.out",
          snap: { value: 1 },
          onUpdate: () => { element.textContent = String(state.value); },
          scrollTrigger: { trigger: element, start: "top 85%", once: true },
        });
      });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      return () => cleanups.forEach((cleanup) => cleanup());
    });

    // Desktop only: depth effects and the masked headline reveal. Phones get a plain fade instead, so
    // touch scrolling stays native-feeling and no pinned/parallax work competes with it.
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const cleanups: Array<() => void> = [];

      // Headlines: words rise out of a per-line mask. Reserved for the two headlines that carry the page
      // (the signal and the closing); the hero headline is excluded because CodeSwitch rewrites it.
      gsap.registerPlugin(SplitText);
      all("[data-split]").forEach((element) => {
        const split = SplitText.create(element, {
          type: "lines,words",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              yPercent: 115,
              duration: 0.9,
              stagger: 0.05,
              ease: EASE_OUT,
              scrollTrigger: { trigger: element, start: "top 88%", once: true },
            }),
        });
        cleanups.push(() => split.revert());
      });

      // Parallax: a few elements, small distances.
      all("[data-parallax]").forEach((element) => {
        const amount = Number(element.dataset.parallax) || 30;
        gsap.fromTo(
          element,
          { y: -amount },
          {
            y: amount,
            ease: "none",
            scrollTrigger: { trigger: element.closest("section") ?? element, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      all("[data-parallax-exit]").forEach((element) => {
        gsap.to(element, {
          y: Number(element.dataset.parallaxExit) || 40,
          ease: "none",
          scrollTrigger: { trigger: element.closest("section") ?? element, start: "top top", end: "bottom top", scrub: true },
        });
      });

      all("[data-scroll-fade]").forEach((element) => {
        gsap.to(element, {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: element.closest("section") ?? element, start: "top top", end: "35% top", scrub: true },
        });
      });

      // Ambient: fixed layers drift a little over the whole document.
      all("[data-ambient-depth]").forEach((layer) => {
        gsap.to(layer, {
          y: Number(layer.dataset.ambientDepth) || -60,
          ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 },
        });
      });

      ScrollTrigger.refresh();
      return () => cleanups.forEach((cleanup) => cleanup());
    });

    mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
      all("[data-split]").forEach((element) => {
        gsap.from(element, { opacity: 0, y: 16, duration: 0.7, ease: EASE_OUT, clearProps: "opacity,transform", scrollTrigger: { trigger: element, start: "top 88%", once: true } });
      });
    });

    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
      headerTrigger.kill();
      header?.removeAttribute("data-scrolled");
    };
  }, []);

  return null;
}
