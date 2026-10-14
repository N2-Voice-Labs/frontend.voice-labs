"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/features/landing/theme/theme-toggle";
import { OPEN_PALETTE_EVENT } from "./command-palette";

const links = [
  { href: "/agents", label: "Agents" },
  { href: "/voices", label: "Voices" },
  { href: "/conversations", label: "Conversations" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/tools", label: "Tools" },
  { href: "/analytics", label: "Analytics" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const [shortcut, setShortcut] = useState("Ctrl K");

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut("⌘K");
  }, []);

  return (
    <header className="dash-header">
      <Link className="marketing-brand dash-brand" href="/" aria-label="Voice Labs home">
        <span className="brand-glyph">v<span>.</span></span><span>voice labs</span><em>Workspace</em>
      </Link>
      <nav className="dash-nav" aria-label="Workspace navigation">
        {links.map((link) => {
          const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return <Link key={link.href} className="dash-link" href={link.href} aria-current={current ? "page" : undefined}>{link.label}</Link>;
        })}
      </nav>
      <div className="dash-actions">
        <ThemeToggle />
        <button className="palette-trigger" data-bare type="button" onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))} aria-label="Search agents and pages">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          <span>Search</span><kbd aria-hidden="true">{shortcut}</kbd>
        </button>
      </div>
    </header>
  );
}
