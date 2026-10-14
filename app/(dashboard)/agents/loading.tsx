export default function Loading() {
  return <main className="page-shell dash-main" aria-busy="true">
    <div className="dash-head"><div><p className="eyebrow">Workspace / Agents</p><h1>Agents</h1><p className="page-intro">Loading your agents…</p></div></div>
    <div className="dash-stats">{[0, 1, 2, 3].map((n) => <div className="dash-stat skeleton" key={n}><span /><strong /><small /></div>)}</div>
    <ul className="agent-grid">{[0, 1, 2, 3, 4, 5].map((n) => <li className="agent-card skeleton" key={n} style={{ "--i": n } as React.CSSProperties}><span /><span /><span /></li>)}</ul>
  </main>;
}
