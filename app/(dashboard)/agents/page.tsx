import Link from "next/link";
import { AgentBrowser } from "@/components/features/agents/agent-browser";
import { AgentOrb } from "@/components/features/agents/agent-orb";
import { buildAgentCards, isLiveStatus, relativeTime } from "@/lib/agent-view";
import { getAgents, getConversations } from "@/lib/platform";

function CountStat({ label, value, note }: Readonly<{ label: string; value: number; note: string }>) {
  return (
    <div className="dash-stat">
      <span className="dash-stat-label">{label}</span>
      <strong className="count-up" style={{ "--target": value } as React.CSSProperties}><span className="sr-only">{value}</span></strong>
      <small>{note}</small>
    </div>
  );
}

export default async function Agents() {
  try {
    const now = Date.now();
    // Conversations only enrich the page; the page still works if that call fails.
    const [agents, conversations] = await Promise.all([getAgents(), getConversations().catch(() => null)]);
    const cards = buildAgentCards(agents, conversations ?? [], now);
    const live = agents.filter((agent) => isLiveStatus(agent.status)).length;
    const latest = conversations?.reduce<string | null>((best, item) => (best === null || Date.parse(item.started_at) > Date.parse(best) ? item.started_at : best), null) ?? null;

    return <main className="page-shell dash-main">
      <div className="dash-head">
        <div>
          <p className="eyebrow">Workspace / Agents</p>
          <h1>Agents</h1>
          <p className="page-intro">Configure voice behavior, then talk to an agent to hear it. Press <kbd className="inline-kbd">⌘K</kbd> to jump anywhere.</p>
        </div>
        <Link className="button-link button-dark" href="/agents/new">New agent <span aria-hidden="true">+</span></Link>
      </div>

      {agents.length === 0 ? (
        <section className="dash-hero-empty">
          <AgentOrb hue={14} size={96} />
          <h2>No agents yet</h2>
          <p>Create your first agent to open the Voice Playground.</p>
          <ol>
            <li><b>01</b> Name it and set its instructions</li>
            <li><b>02</b> Choose languages and providers</li>
            <li><b>03</b> Talk to it in the playground</li>
          </ol>
          <Link className="button-link button-dark" href="/agents/new">Create agent <span aria-hidden="true">+</span></Link>
        </section>
      ) : <>
        <div className="dash-stats">
          <CountStat label="Agents" value={agents.length} note={agents.length === 1 ? "configured" : "configured in total"} />
          <CountStat label="Live" value={live} note={live === agents.length ? "all agents ready" : `${agents.length - live} not live`} />
          {conversations === null
            ? <div className="dash-stat"><span className="dash-stat-label">Conversations</span><strong>—</strong><small>unavailable right now</small></div>
            : <CountStat label="Conversations" value={conversations.length} note="across all agents" />}
          <div className="dash-stat"><span className="dash-stat-label">Last conversation</span><strong className="stat-text">{latest ? relativeTime(latest, now) : "—"}</strong><small>{latest ? "most recent session" : "none yet"}</small></div>
        </div>
        <AgentBrowser agents={cards} />
      </>}
    </main>;
  } catch {
    return <main className="page-shell dash-main">
      <div className="dash-head"><div><p className="eyebrow">Workspace / Agents</p><h1>Agents</h1></div><Link className="button-link button-dark" href="/agents/new">New agent <span aria-hidden="true">+</span></Link></div>
      <section className="dash-hero-empty is-error">
        <AgentOrb hue={4} size={72} />
        <h2>Can’t reach the platform</h2>
        <p role="alert">Platform API is unavailable.</p>
        <p className="muted">Check that the Platform API is running, then try again.</p>
        <Link className="mini-action primary" href="/agents">Try again</Link>
      </section>
    </main>;
  }
}
