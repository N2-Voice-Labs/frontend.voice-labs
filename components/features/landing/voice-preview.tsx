"use client";

import { useState } from "react";

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
    language: "ENGLISH",
    user: "Can you help me find a quieter time to call?",
    agent: "Absolutely. Would tomorrow morning work better for you?",
    note: "Clear turns and calm pacing make space for people to think.",
  },
];

export function VoicePreview() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];

  return (
    <section className="preview-card" aria-label="Illustrative voice conversation preview">
      <div className="preview-topline">
        <span className="preview-label"><span className="preview-dot" /> Conversation preview</span>
        <span className="preview-badge">ILLUSTRATIVE</span>
      </div>
      <div className="preview-body">
        <div className="preview-side-note">
          <span className="preview-index">0{selected + 1}</span>
          <span>{example.language}</span>
        </div>
        <div className="conversation-lines" aria-live="polite">
          <p className="speaker-label">YOU <span>· 00:04</span></p>
          <p className="speech user-speech">{example.user}</p>
          <p className="speaker-label agent-speaker">VOICE LABS <span>· 00:06</span></p>
          <p className="speech agent-speech">{example.agent}</p>
        </div>
        <div className="preview-wave" aria-hidden="true">
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
