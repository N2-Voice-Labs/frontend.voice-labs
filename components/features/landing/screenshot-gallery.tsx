"use client";

import { useState } from "react";

type Shot = { title: string; tag: string; kind: "form" | "voice" | "providers" | "session" | "transcript" | "events" | "list" | "agents" };

const shots: Shot[] = [
  { title: "Agent setup", tag: "Configure", kind: "form" },
  { title: "Voice and languages", tag: "Configure", kind: "voice" },
  { title: "Providers", tag: "Configure", kind: "providers" },
  { title: "Live session", tag: "Test live", kind: "session" },
  { title: "Transcript", tag: "Review", kind: "transcript" },
  { title: "Runtime events", tag: "Review", kind: "events" },
  { title: "Conversation list", tag: "Review", kind: "list" },
  { title: "Agent list", tag: "Configure", kind: "agents" },
];

const bars = [10, 22, 15, 30, 20, 36, 24, 40, 28, 18, 32, 14];

function Visual({ kind }: Readonly<{ kind: Shot["kind"] }>) {
  switch (kind) {
    case "form":
      return <div className="shot-visual"><span className="shot-field">Concierge</span><span className="shot-field">English, Русский</span><span className="shot-area">Greet warmly. Ask one question at a time.</span><span className="shot-pill">Save agent</span></div>;
    case "voice":
      return <div className="shot-visual"><div className="shot-row"><b>EN</b><span className="shot-field">Warm, unhurried</span></div><div className="shot-row"><b>RU</b><span className="shot-field" lang="ru">Мягкий, спокойный</span></div><div className="shot-wave">{bars.map((h, n) => <i key={n} style={{ height: h }} />)}</div></div>;
    case "providers":
      return <div className="shot-visual">{["Speech", "Language", "Voice"].map((label) => <div className="shot-row" key={label}><b>{label}</b><span className="shot-field">Runtime default</span></div>)}</div>;
    case "session":
      return <div className="shot-visual"><div className="shot-wave tall">{bars.map((h, n) => <i key={n} style={{ height: h + 8 }} />)}</div><span className="shot-text">Мне нужно узнать what documents I need…</span><span className="shot-mic" role="presentation" /></div>;
    case "transcript":
      return <div className="shot-visual"><span className="shot-bubble">Can you help me find a quieter time?</span><span className="shot-bubble is-agent">Absolutely. Would tomorrow morning work?</span></div>;
    case "events":
      return <div className="shot-visual">{[["00:04", "Heard two languages"], ["00:06", "Agent replied"], ["00:09", "Caller spoke over agent"]].map(([time, text]) => <div className="shot-row" key={time}><b>{time}</b><span className="shot-text">{text}</span></div>)}</div>;
    case "list":
      return <div className="shot-visual">{["Visa documents", "Reschedule", "Late check-in"].map((title) => <div className="shot-card" key={title}><i className="shot-dot" /><span className="shot-text">{title}</span></div>)}</div>;
    default:
      return <div className="shot-visual">{[["Concierge", "Ready"], ["Studio guide", "Draft"]].map(([name, status]) => <div className="shot-card" key={name}><i className="shot-avatar" /><span className="shot-text">{name}</span><span className="shot-status">{status}</span></div>)}</div>;
  }
}

function ShotCard({ shot, index }: Readonly<{ shot: Shot; index: number }>) {
  return (
    <figure className="shot">
      <div className="shot-frame"><div className="shot-media"><Visual kind={shot.kind} /></div></div>
      <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{shot.title}<em>{shot.tag}</em></figcaption>
    </figure>
  );
}

/** A looping strip of illustrative panels. Pausable, pauses on hover, static strip when motion is reduced. */
export function ScreenshotGallery() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="gallery" data-paused={paused}>
      <div className="gallery-controls">
        <p>{shots.length} illustrative panels, not live data</p>
        <button className="gallery-toggle" data-bare type="button" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span> {paused ? "Play motion" : "Pause motion"}
        </button>
      </div>
      <div className="gallery-viewport" role="group" aria-label="Illustrative workspace panels" tabIndex={0}>
        <div className="gallery-track">
          <div className="gallery-group">{shots.map((shot, index) => <ShotCard shot={shot} index={index} key={shot.title} />)}</div>
          <div className="gallery-group" aria-hidden="true">{shots.map((shot, index) => <ShotCard shot={shot} index={index} key={shot.title} />)}</div>
        </div>
      </div>
    </div>
  );
}
