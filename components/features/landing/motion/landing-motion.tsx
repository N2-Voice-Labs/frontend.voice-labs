"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { EASE_OUT, gsap, ScrollTrigger } from "./gsap";
import { registerSmoothScroll, scrollToElement } from "./scroll-controller";

const REVEAL_FROM = {
  up: { opacity: 0, y: 24 },
  fade: { opacity: 0 },
  scale: { opacity: 0, scale: 0.94, y: 24 },
  line: { scaleX: 0, transformOrigin: "left center" },
} as const;

const all = <T extends HTMLElement>(selector: string) => gsap.utils.toArray<T>(selector);

/**
 * The single owner of page-level motion. Server-rendered sections only carry data attributes:
 *   data-reveal="up|fade|scale|line"   data-reveal-delay="0.1"
 *   data-reveal-group > data-reveal-item   (staggered)
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

      // Entrances: one transform/opacity vocabulary for every section.
      all("[data-reveal]").forEach((element) => {
        const from = REVEAL_FROM[element.dataset.reveal as keyof typeof REVEAL_FROM] ?? REVEAL_FROM.up;
        gsap.from(element, {
          ...from,
          duration: 0.8,
          delay: Number(element.dataset.revealDelay) || 0,
          ease: EASE_OUT,
          clearProps: "opacity,transform,visibility",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });

      all("[data-reveal-group]").forEach((group) => {
        const items = group.querySelectorAll("[data-reveal-item]");
        if (!items.length) return;
        gsap.from(items, {
          opacity: 0,
          y: 24,
          duration: 0.8,
          stagger: 0.09,
          ease: EASE_OUT,
          clearProps: "opacity,transform,visibility",
          scrollTrigger: { trigger: group, start: "top 86%", once: true },
        });
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

      // Ambient: fixed layers drift a little over the whole document.
      all("[data-ambient-depth]").forEach((layer) => {
        gsap.to(layer, {
          y: Number(layer.dataset.ambientDepth) || -60,
          ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 },
        });
      });

      // One pointer-following light, fine pointers only.
      const glow = document.querySelector<HTMLElement>(".pointer-glow");
      if (glow && window.matchMedia("(pointer: fine)").matches) {
        gsap.set(glow, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const moveX = gsap.quickTo(glow, "x", { duration: 0.9, ease: "power3" });
        const moveY = gsap.quickTo(glow, "y", { duration: 0.9, ease: "power3" });
        const onPointerMove = (event: PointerEvent) => {
          moveX(event.clientX);
          moveY(event.clientY);
          glow.classList.add("is-live");
        };
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        cleanups.push(() => {
          window.removeEventListener("pointermove", onPointerMove);
          glow.classList.remove("is-live");
        });
      }

      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      return () => cleanups.forEach((cleanup) => cleanup());
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
