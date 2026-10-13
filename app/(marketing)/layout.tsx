import Link from "next/link";
import { MobileNavigation } from "@/components/features/landing/mobile-navigation";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="marketing-header">
      <Link className="marketing-brand" href="/" aria-label="Voice Labs home"><span className="brand-glyph">v<span>.</span></span><span>voice labs</span></Link>
      <nav className="marketing-nav" aria-label="Main navigation">
        <a href="#product">Product</a>
        <a href="#how-it-works">How it works</a>
        <a href="#platform">Platform</a>
      </nav>
      <Link className="header-access" href="/agents">Platform access <span aria-hidden="true">↗</span></Link>
      <MobileNavigation />
    </header>
    {children}
    <footer className="marketing-footer"><Link className="marketing-brand footer-brand" href="/"><span className="brand-glyph">v<span>.</span></span><span>voice labs</span></Link><p>Make room for more voices.</p><div><a href="#product">Product</a><a href="#how-it-works">How it works</a><Link href="/agents">Open platform ↗</Link></div><span className="footer-copy">© 2026 Voice Labs</span></footer>
  </>;
}
