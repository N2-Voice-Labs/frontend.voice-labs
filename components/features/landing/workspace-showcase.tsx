"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { gsap, type ScrollTrigger } from "./motion/gsap";
import { SectionAmbience } from "./motion/ambient-background";
import { scrollToY } from "./motion/scroll-controller";

const views = [
  { id: "agents", number: "01", tab: "Configure", area: "Agents", copy: "Set purpose, instructions, languages, and voice for each agent." },
  { id: "playground", number: "02", tab: "Test live", area: "Playground", copy: "Open a session, speak naturally, and watch the turns arrive." },
  { id: "conversations", number: "03", tab: "Review", area: "Conversations", copy: "Return to transcripts and runtime events to improve the next call." },
] as const;

const glyphs = ["◉", "⌁", "▤"];
const playgroundBars = [16, 28, 20, 40, 26, 48, 30, 54, 34, 24, 44, 28, 50, 22, 36, 18, 42, 26, 16];

/** Pinned on wide screens: scroll progress drives the dashboard. Elsewhere it is plain tabs. */
export function WorkspaceShowcase() {
  const [active, setActive] = useState(0);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trigger = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)", () => {
      const pin = pinRef.current;
      const stage = stageRef.current;
      const frame = windowRef.current;
      const inner = innerRef.current;
      const glow = glowRef.current;
      const progress = progressRef.current;
      if (!pin || !stage || !frame || !inner || !glow || !progress) return;

      gsap.set(stage, { transformPerspective: 1400, transformOrigin: "50% 100%" });

      // Approach: the window rises into place while the section is still scrolling in.
      const approach = { trigger: pin, start: "top 95%", end: "top top", scrub: 0.6 };
      gsap.fromTo(stage, { scale: 0.9, y: 90, rotateX: 8, opacity: 0.2 }, { scale: 1, y: 0, rotateX: 0, opacity: 1, ease: "none", scrollTrigger: approach });
      gsap.fromTo(inner, { clipPath: "inset(10% 8% 10% 8% round 14px)" }, { clipPath: "inset(0% 0% 0% 0% round 5px)", ease: "none", scrollTrigger: approach });

      // Pinned: progress selects the workspace area and nudges the window and its light.
      const pinned = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(Math.min(views.length - 1, Math.floor(self.progress * views.length))),
        },
      });
      pinned
        .to(frame, { scale: 1.03 }, 0)
        .fromTo(glow, { opacity: 0.55, scale: 0.9 }, { opacity: 1, scale: 1.15 }, 0)
        .fromTo(progress, { scaleY: 0 }, { scaleY: 1 }, 0);
      trigger.current = pinned.scrollTrigger ?? null;

      return () => { trigger.current = null; };
    });
    return () => mm.revert();
  }, []);

  function select(index: number, moveFocus = false) {
    const st = trigger.current;
    if (st) scrollToY(st.start + ((index + 0.5) / views.length) * (st.end - st.start));
    setActive(index);
    if (moveFocus) tabRefs.current[index]?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = views.length - 1;
    const next = { ArrowDown: Math.min(active + 1, last), ArrowRight: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), ArrowLeft: Math.max(active - 1, 0), Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
  }

  return (
    <section className="showcase" id="platform" aria-labelledby="showcase-title">
      <div className="showcase-pin" ref={pinRef}>
        <SectionAmbience kind="showcase" />
        <div className="section-wrap showcase-grid">
          <div className="showcase-copy">
            <p className="eyebrow">04 / YOUR VOICE WORKSPACE</p>
            <h2 id="showcase-title">Every part of the conversation, in view.</h2>
            <p className="showcase-lede">One clear path from setup to learning. Scroll through the workspace, or pick an area.</p>
            <div className="showcase-tabs" role="tablist" aria-label="Workspace areas" aria-orientation="vertical" onKeyDown={onKeyDown} style={{ "--active": active } as CSSProperties}>
              <span className="showcase-rail" aria-hidden="true"><span className="showcase-rail-fill" ref={progressRef} /></span>
              <span className="showcase-indicator" aria-hidden="true" />
              {views.map((view, index) => (
                <button
                  key={view.id}
                  ref={(node) => { tabRefs.current[index] = node; }}
                  className={active === index ? "showcase-tab is-active" : "showcase-tab"}
                  data-bare
                  type="button"
                  role="tab"
                  id={`showcase-tab-${view.id}`}
                  aria-selected={active === index}
                  aria-controls={`showcase-panel-${view.id}`}
                  tabIndex={active === index ? 0 : -1}
                  onClick={() => select(index)}
                >
                  <span className="showcase-tab-number">{view.number}</span>
                  <span className="showcase-tab-text"><strong>{view.tab} <i>· {view.area}</i></strong><small>{view.copy}</small></span>
                </button>
              ))}
            </div>
            <Link className="text-link showcase-link" href="/agents">Open the platform <span aria-hidden="true">↗</span></Link>
          </div>

          <div className="showcase-stage" ref={stageRef}>
            <div className="showcase-glow" ref={glowRef} aria-hidden="true" />
            <div className="showcase-window" ref={windowRef} role="group" aria-label="Illustrative Voice Labs workspace preview">
              <div className="showcase-window-inner" ref={innerRef}>
                <div className="workspace-sidebar" aria-hidden="true">
                  <span className="mini-brand">v<span>.</span></span>
                  {views.map((view, index) => <span className={active === index ? "mini-nav active" : "mini-nav"} key={view.id}>{glyphs[index]} <i>{view.area}</i></span>)}
                  <span className="mini-avatar">VL</span>
                </div>
                <div className="showcase-panels">
                  <div className="workspace-top"><span>WORKSPACE / {views[active].area.toUpperCase()}</span><span>● ILLUSTRATIVE PREVIEW</span></div>
                  <div className="showcase-panel-stack">
                    {views.map((view, index) => (
                      <div
                        key={view.id}
                        className={active === index ? "showcase-panel is-active" : "showcase-panel"}
                        role="tabpanel"
                        id={`showcase-panel-${view.id}`}
                        aria-labelledby={`showcase-tab-${view.id}`}
                        inert={active !== index}
                      >
                        {view.id === "agents" ? <AgentsPanel /> : view.id === "playground" ? <PlaygroundPanel /> : <ConversationsPanel />}
                      </div>
                    ))}
                  </div>
                  <div className="workspace-footnote">Interface preview · capabilities vary by configuration</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentsPanel() {
  return <>
    <div className="workspace-title"><div><small>VOICE AGENTS</small><strong>Your agents</strong></div><span className="mini-create">+ New agent</span></div>
    <div className="workspace-agent"><span className="agent-avatar">◌</span><div><strong>Concierge</strong><small>English · Русский</small></div><span className="agent-status"><i /> Ready</span><b>···</b></div>
    <div className="workspace-agent"><span className="agent-avatar avatar-coral">◉</span><div><strong>Studio guide</strong><small>English</small></div><span className="agent-status status-draft"><i /> Draft</span><b>···</b></div>
    <div className="panel-chips"><span>Speech</span><span>Language</span><span>Voice</span><em>providers per agent</em></div>
  </>;
}

function PlaygroundPanel() {
  return <>
    <div className="workspace-title"><div><small>VOICE PLAYGROUND</small><strong>Concierge</strong></div><span className="live-chip"><i /> Illustrative session</span></div>
    <div className="playground-wave">{playgroundBars.map((height, index) => <span key={index} style={{ "--bar-height": `${height}px`, "--bar-index": index } as CSSProperties} />)}</div>
    <div className="playground-lines">
      <p><small>YOU · 00:04</small>Мне нужно узнать what documents I need for my visa.</p>
      <p className="is-agent"><small>AGENT · 00:06</small>Конечно. I can walk you through the requirements.</p>
    </div>
  </>;
}

function ConversationsPanel() {
  return <>
    <div className="workspace-title"><div><small>CONVERSATIONS</small><strong>Saved sessions</strong></div><span className="mini-create mini-ghost">Transcript</span></div>
    <div className="workspace-agent"><span className="agent-avatar">▤</span><div><strong>Visa documents question</strong><small>EN + RU · 4 turns</small></div><span className="agent-status"><i /> Saved</span><b>···</b></div>
    <ol className="event-list">
      <li><time>00:04</time><span>Heard speech in two languages</span></li>
      <li><time>00:06</time><span>Agent replied in the caller’s mix</span></li>
      <li><time>00:09</time><span>Caller spoke over the agent</span></li>
    </ol>
  </>;
}
