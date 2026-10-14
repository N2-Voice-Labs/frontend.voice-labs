import Link from "next/link";
import { AnimatedVoiceOrb } from "./animated-voice-orb";
import { Comparison } from "./comparison";
import { SectionAmbience } from "./motion/ambient-background";
import { ScreenshotGallery } from "./screenshot-gallery";
import { VoicePreview } from "./voice-preview";
import { WorkspaceShowcase } from "./workspace-showcase";

const capabilities = [
  { number: "01", title: "Multilingual by nature", copy: "Build for English, Russian, and the way people actually move between them. More languages can follow the conversation, not a settings menu." },
  { number: "02", title: "Made for real-time", copy: "Connect speech, language, and voice in one responsive loop. Let people finish a thought, change direction, and speak over the agent." },
  { number: "03", title: "Your choice of providers", copy: "Configure speech, language, and voice providers for each agent, with runtime defaults when you need a simpler start." },
];

const steps = [
  { number: "01", title: "Shape the agent", copy: "Set its purpose, instructions, languages, and voice in one focused workspace." },
  { number: "02", title: "Talk it through", copy: "Open a live session, speak naturally, and see what the runtime hears." },
  { number: "03", title: "Learn from every turn", copy: "Review saved transcripts and runtime events to make the next conversation better." },
];

const facts = [
  { value: 3, label: "provider layers", copy: "Speech, language, and voice, each configurable per agent." },
  { value: 2, label: "languages, one conversation", copy: "English and Russian, in the same breath." },
  { value: 1, label: "workspace, end to end", copy: "Build, test live, and review in one place." },
];

const useCases = ["Customer care", "Travel & stays", "Appointments", "Public services", "And what’s next"];

export function LandingPage() {
  return (
    <main id="main-content" className="marketing-main">
      <section className="hero section-wrap">
        <SectionAmbience kind="hero" />
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="eyebrow-mark" /> A voice platform for the way people speak</p>
          <h1 className="hero-title">Voice AI that speaks your language. <em>Even when you switch.</em></h1>
          <p className="hero-intro">Create voice agents that follow the conversation across English, Russian, and the spaces in between.</p>
          <div className="hero-actions">
            <Link className="button-link button-dark" href="/agents">Try Live Voice <span aria-hidden="true">↗</span></Link>
            <a className="text-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-proof"><span className="proof-wave" aria-hidden="true">〰</span><span>Made for real conversations<br /><strong>not rigid scripts</strong></span></div>
        </div>
        <AnimatedVoiceOrb />
        <div className="hero-scroll" aria-hidden="true" data-scroll-fade><span /> SCROLL TO EXPLORE</div>
      </section>

      <section className="signal-section" id="product">
        <SectionAmbience kind="signal" />
        <div className="section-wrap signal-grid">
          <div className="section-heading">
            <p className="eyebrow" data-reveal>01 / THE HUMAN SIGNAL</p>
            <h2 data-reveal>People don’t speak in dropdowns.</h2>
            <p className="section-intro" data-reveal>A conversation can begin in one language and end in another. Voice Labs is built around that simple, human reality.</p>
            <div className="signal-detail" data-reveal><span className="detail-line" /><span>Language is fluid.<br /><strong>Your agent can be too.</strong></span></div>
          </div>
          <div data-reveal="scale"><VoicePreview /></div>
        </div>
      </section>

      <section className="process-section section-wrap" id="how-it-works">
        <div className="section-topline" data-reveal><p className="eyebrow">02 / A BETTER WAY TO BUILD</p><span className="section-aside">From first prompt to real conversation</span></div>
        <h2 data-reveal>Build for the conversation<br /><em>that actually happens.</em></h2>
        <div className="steps-grid" data-reveal-group>
          {steps.map((step) => <article className="step" key={step.number} data-reveal-item><span className="step-number">{step.number}</span><div className="step-line" /><h3>{step.title}</h3><p>{step.copy}</p></article>)}
        </div>
      </section>

      <section className="capability-section">
        <div className="section-wrap">
          <div className="section-topline" data-reveal><p className="eyebrow">03 / BUILT FOR VOICE</p><span className="section-aside">An adaptable platform, one conversation at a time</span></div>
          <div className="capability-heading"><h2 data-reveal>Less translation.<br /><em>More understanding.</em></h2><p data-reveal data-reveal-delay="0.12">Give your team the tools to shape voice experiences around people, providers, and the work in front of them.</p></div>
          <div className="capability-list" data-reveal-group>{capabilities.map((item) => <article className="capability-row" key={item.number} data-reveal-item><span className="cap-number">{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p><span className="cap-arrow" aria-hidden="true">↗</span></article>)}</div>
        </div>
      </section>

      <WorkspaceShowcase />

      <section className="stats-section" aria-labelledby="stats-title">
        <SectionAmbience kind="stats" />
        <div className="section-wrap">
          <div className="section-topline" data-reveal><p className="eyebrow">05 / THE SHAPE OF IT</p><span className="section-aside">Product facts, not usage metrics</span></div>
          <h2 id="stats-title" data-reveal>Simple by design.</h2>
          <div className="stats-grid" data-reveal-group>
            {facts.map((fact) => (
              <div className="stat" key={fact.label} data-reveal-item>
                <span className="stat-value" data-count-to={fact.value}>{fact.value}</span>
                <span className="stat-label">{fact.label}</span>
                <p>{fact.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="compare-section section-wrap" aria-labelledby="compare-title">
        <div className="section-topline" data-reveal><p className="eyebrow">06 / A DIFFERENT KIND OF VOICE</p><span className="section-aside">Open a row for the detail</span></div>
        <div className="compare-intro">
          <h2 id="compare-title" data-reveal>Not another<br /><em>phone menu.</em></h2>
          <p data-reveal data-reveal-delay="0.12">How Voice Labs differs from scripted voice menus in the moments that matter to the person on the line.</p>
        </div>
        <Comparison />
      </section>

      <section className="gallery-section" aria-labelledby="gallery-title">
        <div className="section-wrap">
          <div className="section-topline" data-reveal><p className="eyebrow">07 / INSIDE THE WORKSPACE</p><span className="section-aside">Illustrative panels, not live data</span></div>
          <h2 id="gallery-title" data-reveal>A closer look at the workspace.</h2>
        </div>
        <div data-reveal="fade"><ScreenshotGallery /></div>
      </section>

      <section className="usecase-section">
        <div className="section-wrap usecase-grid"><p className="eyebrow" data-reveal>08 / ONE PLATFORM, MANY CONVERSATIONS</p><div><h2 data-reveal>Wherever a helpful voice can make a difference.</h2><p data-reveal data-reveal-delay="0.1">Support, bookings, hospitality, transportation, public services, and the work no one has named yet.</p><div className="usecase-tags" data-reveal-group>{useCases.map((item) => <span key={item} data-reveal-item>{item}</span>)}</div></div></div>
      </section>

      <section className="closing-section section-wrap">
        <SectionAmbience kind="closing" />
        <div className="closing-visual" aria-hidden="true" data-parallax="50">
          <div className="closing-window">
            <div className="workspace-sidebar"><span className="mini-brand">v<span>.</span></span><span className="mini-nav active">◉ <i>Agents</i></span><span className="mini-nav">⌁ <i>Playground</i></span><span className="mini-nav">▤ <i>Conversations</i></span></div>
            <div className="workspace-content"><div className="workspace-title"><div><small>VOICE AGENTS</small><strong>Your agents</strong></div></div><div className="workspace-agent"><span className="agent-avatar">◌</span><div><strong>Concierge</strong><small>English · Русский</small></div><span className="agent-status"><i /> Ready</span></div><div className="workspace-agent"><span className="agent-avatar avatar-coral">◉</span><div><strong>Studio guide</strong><small>English</small></div><span className="agent-status status-draft"><i /> Draft</span></div></div>
          </div>
        </div>
        <span className="closing-orbit" aria-hidden="true" />
        <p className="eyebrow" data-reveal>START WITH A CONVERSATION</p>
        <h2 data-reveal>Give your next idea<br />a voice.</h2>
        <p data-reveal data-reveal-delay="0.1">Bring a use case. Leave with a clearer sense of what it could sound like.</p>
        <Link className="button-link button-coral" href="/agents" data-reveal data-reveal-delay="0.18">Step into Voice Labs <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
