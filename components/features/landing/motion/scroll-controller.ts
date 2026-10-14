import type Lenis from "lenis";

let active: Lenis | null = null;

export function registerSmoothScroll(instance: Lenis | null) {
  active = instance;
}

/** Scrolls through Lenis when it is running, otherwise falls back to the browser. */
export function scrollToY(y: number) {
  if (active) active.scrollTo(y, { duration: 1.1 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

/** Lenis honours the page's `scroll-padding-top`; the native fallback applies it by hand. */
export function scrollToElement(target: HTMLElement) {
  if (active) {
    active.scrollTo(target, { duration: 1.1 });
    return;
  }
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - padding, behavior: "smooth" });
}
