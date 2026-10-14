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
      return <div className="shot-visual"><i className="shot-field w60" /><i className="shot-field" /><i className="shot-area" /><i className="shot-pill" /></div>;
    case "voice":
      return <div className="shot-visual"><div className="shot-row"><b>EN</b><i className="shot-field w60" /></div><div className="shot-row"><b>RU</b><i className="shot-field w40" /></div><div className="shot-wave">{bars.map((h, n) => <i key={n} style={{ height: h }} />)}</div></div>;
    case "providers":
      return <div className="shot-visual">{["Speech", "Language", "Voice"].map((label) => <div className="shot-row" key={label}><b>{label}</b><i className="shot-field" /></div>)}</div>;
    case "session":
      return <div className="shot-visual"><div className="shot-wave tall">{bars.map((h, n) => <i key={n} style={{ height: h + 8 }} />)}</div><i className="shot-line w80" /><i className="shot-line w60" /><i className="shot-mic" /></div>;
    case "transcript":
      return <div className="shot-visual"><i className="shot-bubble" /><i className="shot-bubble is-agent" /><i className="shot-bubble" /></div>;
    case "events":
      return <div className="shot-visual">{["00:04", "00:06", "00:09", "00:12"].map((time) => <div className="shot-row" key={time}><b>{time}</b><i className="shot-line" /></div>)}</div>;
    case "list":
      return <div className="shot-visual">{[0, 1, 2].map((n) => <div className="shot-card" key={n}><i className="shot-dot" /><i className="shot-line w60" /></div>)}</div>;
    default:
      return <div className="shot-visual">{[0, 1].map((n) => <div className="shot-card" key={n}><i className="shot-avatar" /><i className="shot-line w40" /><i className="shot-pill small" /></div>)}</div>;
  }
}

function ShotCard({ shot, index }: Readonly<{ shot: Shot; index: number }>) {
  return (
    <figure className="shot">
      <div className="shot-frame"><div className="shot-media"><div className="shot-chrome"><i /><i /><i /></div><Visual kind={shot.kind} /></div></div>
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
        <p>{shots.length} illustrative panels · hover to magnify</p>
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
