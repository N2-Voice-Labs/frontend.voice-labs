"use client";

import { animate, createScope, stagger } from "animejs";
import { useCallback, useEffect, useRef, useState } from "react";
import { overallLevel, spectrumToBars } from "./voice-input";

const waveform = [12, 24, 36, 18, 48, 25, 42, 15, 34, 20, 12];

/** A decorative, explicitly illustrative voice signal for the marketing hero. */
type Mic = "off" | "asking" | "on" | "blocked";

export function AnimatedVoiceOrb() {
  const root = useRef<HTMLDivElement>(null);
  const bars = useRef<ReturnType<typeof animate> | null>(null);
  const stopListening = useRef<(() => void) | null>(null);
  const [supported, setSupported] = useState(false);
  const [mic, setMic] = useState<Mic>("off");

  // Offer "Speak to it" only where it can work and where motion is welcome.
  useEffect(() => {
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSupported(Boolean(navigator.mediaDevices?.getUserMedia) && !reduced);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    let observer: IntersectionObserver | undefined;
    const scope = createScope({
      root,
      mediaQueries: { reduceMotion: "(prefers-reduced-motion: reduce)" },
    }).add((self) => {
      if (!self || self.matches.reduceMotion) return;
      // Phones hide the orbit rings, nodes and trace (see globals.css), so they must not animate them either.
      const phone = typeof window.matchMedia === "function" && window.matchMedia("(max-width: 720px)").matches;

      animate(".art-core", {
        opacity: [0, 1],
        scale: [0.88, 1],
        translateY: [18, 0],
        duration: 900,
        delay: 250,
        ease: "outExpo",
      });
      if (!phone) {
        animate(".art-orbit", {
          opacity: [0, 1],
          scale: [0.8, 1],
          delay: stagger(130, { start: 250 }),
          duration: 1100,
          ease: "outExpo",
        });
        animate(".orbit-node", {
          opacity: [0, 1],
          scale: [0.25, 1],
          delay: stagger(90, { start: 400 }),
          duration: 700,
          ease: "outBack",
        });
      }
      const orbit = phone ? null : animate(".orbit-one", {
        rotate: ["-30deg", "-24deg"],
        duration: 18000,
        ease: "linear",
        alternate: true,
        loop: true,
      });
      const trace = phone ? null : animate(".signal-trace", {
        strokeDashoffset: [0, -150],
        duration: 9000,
        ease: "linear",
        loop: true,
      });
      bars.current = animate(".core-sound i", {
        scaleY: [0.38, 1.15],
        duration: 850,
        delay: stagger(85, { from: "center" }),
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });

      // The loops are endless; stop spending frames on them once the hero has scrolled away.
      if (typeof IntersectionObserver === "function") {
        observer = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) {
            orbit?.pause();
            trace?.pause();
            bars.current?.pause();
            return;
          }
          orbit?.resume();
          trace?.resume();
          if (element.dataset.live !== "true") bars.current?.resume();
        });
        observer.observe(element);
      }
    });

    return () => {
      observer?.disconnect();
      scope.revert();
    };
  }, []);

  useEffect(() => () => stopListening.current?.(), []);

  const toggleMic = useCallback(async () => {
    const element = root.current;
    if (!element) return;
    if (stopListening.current) {
      stopListening.current();
      return;
    }

    setMic("asking");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setMic("blocked");
      return;
    }

    // Analysis only: the stream feeds an AnalyserNode and is never recorded, stored, or sent.
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;
    context.createMediaStreamSource(stream).connect(analyser);
    const spectrum = new Uint8Array(analyser.frequencyBinCount);
    const barElements = Array.from(element.querySelectorAll<HTMLElement>(".core-sound i"));
    let frame = 0;

    bars.current?.pause();
    element.dataset.live = "true";
    setMic("on");

    const tick = () => {
      analyser.getByteFrequencyData(spectrum);
      const values = spectrumToBars(spectrum, barElements.length);
      element.style.setProperty("--voice", overallLevel(values).toFixed(3));
      barElements.forEach((bar, index) => { bar.style.transform = `scaleY(${(0.22 + values[index] * 1.5).toFixed(3)})`; });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    stopListening.current = () => {
      cancelAnimationFrame(frame);
      stream.getTracks().forEach((track) => track.stop());
      void context.close().catch(() => undefined);
      element.removeAttribute("data-live");
      element.style.removeProperty("--voice");
      barElements.forEach((bar) => { bar.style.removeProperty("transform"); });
      bars.current?.resume();
      stopListening.current = null;
      setMic("off");
    };
  }, []);

  function moveArtwork(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--pointer-x", `${x * 14}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${y * 14}px`);
  }

  // A tap on the orb sends one signal in through the hero network and lets the orb answer. It costs
  // nothing until someone taps, so it is the phone's stand-in for the desktop's continuous motion.
  function pingOrb(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest(".orb-voice")) return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = event.currentTarget;
    element.classList.remove("is-ping");
    void element.offsetWidth; // restart the CSS animation on a quick second tap
    element.classList.add("is-ping");
    window.setTimeout(() => element.classList.remove("is-ping"), 900);
    window.dispatchEvent(new CustomEvent("vl:orb-ping"));
  }

  function resetArtwork(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--pointer-x", "0px");
    event.currentTarget.style.setProperty("--pointer-y", "0px");
  }

  return (
    <div className="hero-art" ref={root} data-parallax-exit="56" onPointerMove={moveArtwork} onPointerLeave={resetArtwork} onPointerUp={pingOrb}>
      <div className="art-visual" role="img" aria-label="Illustrative voice signal. It reacts to your voice only if you choose Speak to it.">
      <div className="art-aura" aria-hidden="true" />
      <svg className="art-signal" viewBox="0 0 600 600" aria-hidden="true">
        <defs>
          <linearGradient id="signal-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--signal)" />
          </linearGradient>
        </defs>
        <ellipse className="art-orbit orbit-one" cx="300" cy="300" rx="196" ry="92" />
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
      <span className="orbit-label label-en"><span className="language-pip" /> EN</span>
      <span className="orbit-label label-ru"><span className="language-pip" /> RU</span>
      <span className="orbit-label label-live"><i /> Illustrative</span>
      </div>
      {supported && (
        <div className="orb-voice">
          <button className="orb-voice-button" data-bare type="button" aria-pressed={mic === "on"} disabled={mic === "asking"} onClick={() => void toggleMic()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></svg>
            {mic === "on" ? "Listening. Tap to stop" : mic === "asking" ? "Allow the microphone…" : "Speak to it"}
          </button>
          <p className="orb-voice-note" aria-live="polite">
            {mic === "blocked" ? "Microphone blocked. Allow it in your browser to try this." : mic === "on" ? "Live from your mic. Nothing is recorded or sent." : "Optional. Uses your microphone; nothing is recorded or sent."}
          </p>
        </div>
      )}
    </div>
  );
}
