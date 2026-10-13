import Link from "next/link";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>
    <header className="site-header">
      <Link className="brand" href="/agents">Voice Labs <span>Workspace</span></Link>
      <nav aria-label="Workspace navigation"><Link href="/agents">Agents</Link><Link href="/conversations">Conversations</Link><Link href="/">Public site ↗</Link></nav>
    </header>
    {children}
    <footer className="site-footer">Voice Labs <span>·</span> Voice agent workspace</footer>
  </>;
}
