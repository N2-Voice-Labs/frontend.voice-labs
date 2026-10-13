import Link from "next/link";
import { AnimatedVoiceOrb } from "./animated-voice-orb";
import { VoicePreview } from "./voice-preview";

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

export function LandingPage() {
  return (
    <main id="main-content" className="marketing-main">
      <section className="hero section-wrap">
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
        <div className="hero-scroll" aria-hidden="true"><span /> SCROLL TO EXPLORE</div>
      </section>

      <section className="signal-section" id="product">
        <div className="section-wrap signal-grid">
          <div className="section-heading">
            <p className="eyebrow">01 / THE HUMAN SIGNAL</p>
            <h2>People don’t speak in dropdowns.</h2>
            <p className="section-intro">A conversation can begin in one language and end in another. Voice Labs is built around that simple, human reality.</p>
            <div className="signal-detail"><span className="detail-line" /><span>Language is fluid.<br /><strong>Your agent can be too.</strong></span></div>
          </div>
          <VoicePreview />
        </div>
      </section>

      <section className="process-section section-wrap" id="how-it-works">
        <div className="section-topline"><p className="eyebrow">02 / A BETTER WAY TO BUILD</p><span className="section-aside">From first prompt to real conversation</span></div>
        <h2>Build for the conversation<br /><em>that actually happens.</em></h2>
        <div className="steps-grid">
          {steps.map((step) => <article className="step" key={step.number}><span className="step-number">{step.number}</span><div className="step-line" /><h3>{step.title}</h3><p>{step.copy}</p></article>)}
        </div>
      </section>

      <section className="capability-section">
        <div className="section-wrap">
          <div className="section-topline"><p className="eyebrow">03 / BUILT FOR VOICE</p><span className="section-aside">An adaptable platform, one conversation at a time</span></div>
          <div className="capability-heading"><h2>Less translation.<br /><em>More understanding.</em></h2><p>Give your team the tools to shape voice experiences around people, providers, and the work in front of them.</p></div>
          <div className="capability-list">{capabilities.map((item) => <article className="capability-row" key={item.number}><span className="cap-number">{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p><span className="cap-arrow" aria-hidden="true">↗</span></article>)}</div>
        </div>
      </section>

      <section className="platform-section section-wrap" id="platform">
        <div className="platform-copy"><p className="eyebrow">04 / YOUR VOICE WORKSPACE</p><h2>Every part of the conversation, in view.</h2><p>Configure an agent, test its voice in real time, then return to the transcript and runtime events. One clear path from setup to learning.</p><Link className="text-link" href="/agents">Open the platform <span aria-hidden="true">↗</span></Link></div>
        <div className="workspace-preview" aria-label="Illustrative Voice Labs workspace preview">
          <div className="workspace-sidebar"><span className="mini-brand">v<span>.</span></span><span className="mini-nav active">◉ <i>Agents</i></span><span className="mini-nav">⌁ <i>Playground</i></span><span className="mini-nav">▤ <i>Conversations</i></span><span className="mini-avatar">VL</span></div>
          <div className="workspace-content"><div className="workspace-top"><span>WORKSPACE / AGENTS</span><span>● PLATFORM READY</span></div><div className="workspace-title"><div><small>VOICE AGENTS</small><strong>Your agents</strong></div><span className="mini-create">+ New agent</span></div><div className="workspace-agent"><span className="agent-avatar">◌</span><div><strong>Concierge</strong><small>English · Русский</small></div><span className="agent-status"><i /> Ready</span><b>···</b></div><div className="workspace-agent"><span className="agent-avatar avatar-coral">◉</span><div><strong>Studio guide</strong><small>English</small></div><span className="agent-status status-draft"><i /> Draft</span><b>···</b></div><div className="workspace-footnote">Interface preview · capabilities vary by configuration</div></div>
        </div>
      </section>

      <section className="usecase-section">
        <div className="section-wrap usecase-grid"><p className="eyebrow">05 / ONE PLATFORM, MANY CONVERSATIONS</p><div><h2>Wherever a helpful voice can make a difference.</h2><p>Support, bookings, hospitality, transportation, public services, and the work no one has named yet.</p><div className="usecase-tags"><span>Customer care</span><span>Travel & stays</span><span>Appointments</span><span>Public services</span><span>And what’s next</span></div></div></div>
      </section>

      <section className="closing-section section-wrap"><span className="closing-orbit" aria-hidden="true" /><p className="eyebrow">START WITH A CONVERSATION</p><h2>Give your next idea<br />a voice.</h2><p>Bring a use case. Leave with a clearer sense of what it could sound like.</p><Link className="button-link button-coral" href="/agents">Step into Voice Labs <span aria-hidden="true">↗</span></Link></section>
    </main>
  );
}
