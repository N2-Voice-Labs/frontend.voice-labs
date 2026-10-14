import Link from "next/link";
import { AnimatedVoiceOrb } from "./animated-voice-orb";
import { CodeSwitch } from "./code-switch";
import { Comparison } from "./comparison";
import { HeroNetwork } from "@/components/features/network/network-background";
import { SectionAmbience } from "./motion/ambient-background";
import { ScreenshotGallery } from "./screenshot-gallery";
import { VoicePreview } from "./voice-preview";
import { WorkspaceShowcase } from "./workspace-showcase";

const capabilities = [
  { number: "01", title: "Mixed-language conversations", copy: "Agents handle English, Russian, and callers who move between the two within a single sentence." },
  { number: "02", title: "Real-time speech", copy: "Speech, language, and voice work in one responsive loop. Callers can finish a thought, change direction, and speak over the agent." },
  { number: "03", title: "Configurable providers", copy: "Choose speech, language, and voice providers for each agent, or start from the runtime defaults." },
];

const facts = [
  { value: 3, label: "provider layers", copy: "Speech, language, and voice, each configurable per agent." },
  { value: 2, label: "languages, one conversation", copy: "English and Russian within one conversation." },
  { value: 1, label: "workspace, end to end", copy: "Build, test live, and review in one place." },
];

const useCases = ["Customer care", "Travel and stays", "Appointments", "Public services"];

export function LandingPage() {
  return (
    <main id="main-content" className="marketing-main">
      <div className="hero-stage">
      <HeroNetwork />
      <section className="hero section-wrap">
        <SectionAmbience kind="hero" />
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="eyebrow-mark" /> Voice agents for English and Russian</p>
          <h1 className="hero-title">Voice AI that speaks your language. <em><CodeSwitch /></em></h1>
          <p className="hero-intro">Build voice agents that follow callers when they switch between English and Russian mid-conversation.</p>
          <div className="hero-actions">
            <Link className="button-link button-dark" href="/agents">Try live voice <span aria-hidden="true">↗</span></Link>
            <a className="text-link" href="#platform">See how it works <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <AnimatedVoiceOrb />
      </section>
      </div>

      <section className="signal-section" id="product" data-sequence>
        <SectionAmbience kind="signal" />
        <div className="section-wrap signal-grid">
          <div className="section-heading">
            <p className="eyebrow" data-step="0">Language switching</p>
            <h2 data-split>Conversations don’t stay in one language.</h2>
            <p className="section-intro" data-step="1">Callers often start in one language and finish in another. Voice Labs agents follow the change without asking them to choose again.</p>
            <div className="signal-detail" data-step="2"><span className="detail-line" /><span>Language is fluid.<br /><strong>Your agent can be too.</strong></span></div>
          </div>
          <div data-step="0" data-step-from="scale"><VoicePreview /></div>
        </div>
      </section>

      <section className="capability-section" data-sequence>
        <div className="section-wrap">
          <p className="eyebrow" data-step="0">Capabilities</p>
          <div className="capability-heading"><h2 data-step="0">Built for<br /><em>real conversations.</em></h2><p data-step="1">Configure how each agent listens, reasons, and speaks, and test it live before it takes a call.</p></div>
          <div className="capability-list">{capabilities.map((item) => <article className="capability-row" key={item.number} data-step="2"><span className="cap-number">{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p><span className="cap-arrow" aria-hidden="true">↗</span></article>)}</div>
        </div>
      </section>

      <WorkspaceShowcase />

      <section className="stats-section" aria-labelledby="stats-title" data-sequence>
        <SectionAmbience kind="stats" />
        <div className="section-wrap">
          <h2 id="stats-title" className="sr-only">Simple by design</h2>
          <p className="eyebrow stats-note" data-step="0">Product facts, not usage metrics</p>
          <div className="stats-grid">
            {facts.map((fact) => (
              <div className="stat" key={fact.label} data-step="1">
                <span className="stat-value" data-count-to={fact.value}>{fact.value}</span>
                <span className="stat-label">{fact.label}</span>
                <p>{fact.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="compare-section section-wrap" id="compare" aria-labelledby="compare-title" data-sequence>
        <p className="eyebrow" data-step="0">Comparison</p>
        <div className="compare-intro">
          <h2 id="compare-title" data-step="0">Compared with<br /><em>scripted phone menus.</em></h2>
          <p data-step="1">Where Voice Labs behaves differently in the moments that matter to the person on the call.</p>
        </div>
        <div data-step="2"><Comparison /></div>
      </section>

      <section className="gallery-section" aria-labelledby="gallery-title" data-sequence>
        <div className="section-wrap">
          <p className="eyebrow" data-step="0">Workspace</p>
          <h2 id="gallery-title" data-step="0">A look inside the workspace.</h2>
        </div>
        <div data-step="1" data-step-from="fade"><ScreenshotGallery /></div>
      </section>

      <section className="closing-section section-wrap" data-sequence>
        <SectionAmbience kind="closing" />
        <div className="closing-visual" aria-hidden="true" data-parallax="50">
          <div className="closing-window">
            <div className="workspace-sidebar"><span className="mini-brand">v<span>.</span></span><span className="mini-nav active">◉ <i>Agents</i></span><span className="mini-nav">⌁ <i>Playground</i></span><span className="mini-nav">▤ <i>Conversations</i></span></div>
            <div className="workspace-content"><div className="workspace-title"><div><small>VOICE AGENTS</small><strong>Your agents</strong></div></div><div className="workspace-agent"><span className="agent-avatar">◌</span><div><strong>Concierge</strong><small>English · Русский</small></div><span className="agent-status"><i /> Ready</span></div><div className="workspace-agent"><span className="agent-avatar avatar-coral">◉</span><div><strong>Studio guide</strong><small>English</small></div><span className="agent-status status-draft"><i /> Draft</span></div></div>
          </div>
        </div>
        <p className="eyebrow" data-step="0">Get started</p>
        <h2 data-split>Build your first<br />voice agent.</h2>
        <p data-step="1">Set up an agent, speak to it in the playground, and review the conversation afterwards.</p>
        <Link className="button-link button-coral" href="/agents" data-step="1">Open Voice Labs <span aria-hidden="true">↗</span></Link>
        <p className="closing-uses" data-step="2">Used for {useCases.map((item) => item.toLowerCase()).join(", ")}.</p>
      </section>
    </main>
  );
}
