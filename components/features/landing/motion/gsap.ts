"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const EASE_OUT = "expo.out";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** True when JS-driven motion is allowed (matchMedia exists and the user has not asked for less). */
export function canAnimate() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && !prefersReducedMotion();
}
