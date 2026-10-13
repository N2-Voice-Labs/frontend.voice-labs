import Link from "next/link";
import { getAgents } from "@/lib/platform";

export default async function Agents() {
  try {
    const agents = await getAgents();
    return <main className="page-shell">
      <p className="eyebrow">Workspace</p><h1>Agents</h1>
      <p className="page-intro">Configure voice behavior and test a session with your runtime.</p>
      <Link className="button-link" href="/agents/new">Create agent</Link>
      {agents.length === 0 ? <section className="panel"><h2>No agents yet</h2><p>Create your first agent to open the Voice Playground.</p></section> :
        <ul className="list-stack">{agents.map((agent) => <li className="list-row" key={agent.id}><Link href={`/agents/${agent.id}`}>{agent.name}</Link><p className="muted">{agent.description || "No description"} · {agent.status} · {agent.enabled_languages.join(", ")}</p></li>)}</ul>}
    </main>;
  } catch {
    return <main className="page-shell"><h1>Agents</h1><p role="alert">Platform API is unavailable.</p><Link className="button-link" href="/agents/new">Create agent</Link></main>;
  }
}
