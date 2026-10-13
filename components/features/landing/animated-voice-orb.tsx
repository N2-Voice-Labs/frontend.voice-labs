"use client";

import { animate, createScope, stagger } from "animejs";
import { useEffect, useRef } from "react";

const waveform = [12, 24, 36, 18, 48, 25, 42, 15, 34, 20, 12];

/** A decorative, explicitly illustrative voice signal for the marketing hero. */
export function AnimatedVoiceOrb() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const scope = createScope({
      root,
      mediaQueries: { reduceMotion: "(prefers-reduced-motion: reduce)" },
    }).add((self) => {
      if (!self || self.matches.reduceMotion) return;

      animate(".art-core", {
        opacity: [0, 1],
        scale: [0.88, 1],
        translateY: [18, 0],
        duration: 900,
        ease: "outExpo",
      });
      animate(".art-orbit", {
        opacity: [0, 1],
        scale: [0.8, 1],
        delay: stagger(130),
        duration: 1100,
        ease: "outExpo",
      });
      animate(".orbit-node", {
        opacity: [0, 1],
        scale: [0.25, 1],
        delay: stagger(90),
        duration: 700,
        ease: "outBack",
      });
      animate(".art-core", {
        translateY: [0, -7],
        duration: 3600,
        delay: 900,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
      animate(".orbit-one", {
        rotate: ["-38deg", "-30deg"],
        duration: 18000,
        ease: "linear",
        alternate: true,
        loop: true,
      });
      animate(".orbit-two", {
        rotate: ["39deg", "31deg"],
        duration: 22000,
        ease: "linear",
        alternate: true,
        loop: true,
      });
      animate(".signal-trace", {
        strokeDashoffset: [0, -150],
        duration: 9000,
        ease: "linear",
        loop: true,
      });
      animate(".core-sound i", {
        scaleY: [0.38, 1.15],
        duration: 850,
        delay: stagger(85, { from: "center" }),
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
    });

    return () => scope.revert();
  }, []);

  function moveArtwork(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--pointer-x", `${x * 14}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${y * 14}px`);
  }

  function resetArtwork(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--pointer-x", "0px");
    event.currentTarget.style.setProperty("--pointer-y", "0px");
  }

  return (
    <div
      className="hero-art"
      ref={root}
      role="img"
      aria-label="Illustrative voice signal, not a live session"
      onPointerMove={moveArtwork}
      onPointerLeave={resetArtwork}
    >
      <div className="art-aura" aria-hidden="true" />
      <svg className="art-signal" viewBox="0 0 600 600" aria-hidden="true">
        <defs>
          <linearGradient id="signal-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--signal)" />
          </linearGradient>
        </defs>
        <ellipse className="art-orbit orbit-one" cx="300" cy="300" rx="234" ry="124" />
        <ellipse className="art-orbit orbit-two" cx="300" cy="300" rx="254" ry="168" />
        <ellipse className="art-orbit orbit-three" cx="300" cy="300" rx="188" ry="222" />
        <ellipse className="signal-trace" cx="300" cy="300" rx="234" ry="124" />
        <circle className="orbit-node node-one" cx="81" cy="224" r="5" />
        <circle className="orbit-node node-two" cx="484" cy="407" r="4" />
        <circle className="orbit-node node-three" cx="409" cy="94" r="3" />
      </svg>
      <div className="art-core">
        <span className="core-mark">v<span>.</span></span>
        <div className="core-sound" aria-hidden="true">
          {waveform.map((height, index) => <i key={index} style={{ height }} />)}
        </div>
        <span className="core-index">VOICE / 01</span>
      </div>
      <span className="orbit-label label-en"><span className="language-pip" /> EN <i>01</i></span>
      <span className="orbit-label label-ru"><span className="language-pip" /> RU <i>02</i></span>
      <span className="orbit-label label-live"><i /> ILLUSTRATIVE SIGNAL</span>
      <span className="hero-caption">One conversation.<br />More than one language.</span>
      <span className="art-coordinate">RU ↔ EN<br />LANGUAGE IN MOTION</span>
    </div>
  );
}
