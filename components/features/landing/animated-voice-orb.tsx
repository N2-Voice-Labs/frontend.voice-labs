"use client";

import { animate, createScope, stagger } from "animejs";
import { useEffect, useRef } from "react";

const waveform = [12, 24, 36, 18, 48, 25, 42, 15, 34, 20, 12];

/** A decorative, explicitly illustrative voice signal for the marketing hero. */
export function AnimatedVoiceOrb() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;

    const scope = createScope({
      root,
      mediaQueries: { reduceMotion: "(prefers-reduced-motion: reduce)" },
    }).add((self) => {
      if (!self || self.matches.reduceMotion) return;

      animate(".art-core", {
        translateY: [0, -8],
        duration: 3600,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
      animate(".orbit-one", {
        rotate: ["-38deg", "-34deg"],
        duration: 12000,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
      animate(".orbit-two", {
        rotate: ["39deg", "35deg"],
        duration: 15000,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
      animate(".core-sound i", {
        scaleY: [0.62, 1.18],
        duration: 850,
        delay: stagger(85, { from: "center" }),
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
    });

    return () => scope.revert();
  }, []);

  return (
    <div className="hero-art" ref={root} role="img" aria-label="Illustrative voice signal, not a live session">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-core">
        <span className="core-mark">v<span>.</span></span>
        <div className="core-sound" aria-hidden="true">
          {waveform.map((height, index) => <i key={index} style={{ height }} />)}
        </div>
      </div>
      <span className="orbit-label label-en">EN <span>01</span></span>
      <span className="orbit-label label-ru">RU <span>02</span></span>
      <span className="orbit-label label-live"><i /> CONCEPT MOTION</span>
      <span className="hero-caption">One conversation.<br />More than one language.</span>
      <span className="art-coordinate">VOICE / 02<br />SIGNAL STUDY</span>
    </div>
  );
}
