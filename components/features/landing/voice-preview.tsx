"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { canAnimate, EASE_OUT, gsap } from "./motion/gsap";

const examples = [
  {
    label: "Code-switching",
    language: "EN + RU",
    user: "Мне нужно узнать what documents I need for my visa.",
    agent: "Конечно. I can walk you through the requirements, step by step.",
    note: "A single thought, in two languages. Understood as one conversation.",
  },
  {
    label: "Natural turn-taking",
    language: "English",
    user: "Can you help me find a quieter time to call?",
    agent: "Absolutely. Would tomorrow morning work better for you?",
    note: "Turns stay clear and the pacing leaves people room to think.",
  },
];

export function VoicePreview() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  const lines = useRef<HTMLDivElement>(null);
  const waves = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Cross-fade the conversation when the example changes (not on first paint).
  useLayoutEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!canAnimate() || !lines.current) return;
    const tween = gsap.fromTo(lines.current.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: EASE_OUT, clearProps: "opacity,transform" });
    const bars = waves.current?.children;
    const wave = bars ? gsap.fromTo(bars, { scaleY: 0.25 }, { scaleY: 1, duration: 0.6, stagger: 0.012, ease: EASE_OUT, clearProps: "transform" }) : null;
    return () => { tween.revert(); wave?.revert(); };
  }, [selected]);

  return (
    <section className="preview-card" aria-label="Illustrative voice conversation preview">
      <div className="preview-topline">
        <span className="preview-label"><span className="preview-dot" /> Conversation preview</span>
        <span className="preview-badge">Illustrative</span>
      </div>
      <div className="preview-body">
        <div className="preview-side-note">
          <span className="preview-index">0{selected + 1}</span>
          <span>{example.language}</span>
        </div>
        <div className="conversation-lines" aria-live="polite" ref={lines}>
          <p className="speaker-label">You <span>· 00:04</span></p>
          <p className="speech user-speech">{example.user}</p>
          <p className="speaker-label agent-speaker">UNAI <span>· 00:06</span></p>
          <p className="speech agent-speech">{example.agent}</p>
        </div>
        <div className="preview-wave" aria-hidden="true" ref={waves}>
          {[14, 24, 18, 37, 27, 48, 32, 58, 39, 25, 45, 30, 52, 22, 34, 18, 41, 26, 16, 33, 20].map((height, index) => (
            <span key={index} style={{ "--bar-height": `${height}px` } as React.CSSProperties} />
          ))}
        </div>
      </div>
      <div className="preview-bottom">
        <p>{example.note}</p>
        <div className="preview-tabs" role="group" aria-label="Choose conversation preview">
          {examples.map((item, index) => (
            <button
              key={item.label}
              className={selected === index ? "preview-tab is-selected" : "preview-tab"}
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
