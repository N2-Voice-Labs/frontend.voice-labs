// jsdom has no matchMedia; GSAP's ScrollTrigger needs one. Report "no match" for every query,
// which exercises the non-pinned, non-reduced-motion paths.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
