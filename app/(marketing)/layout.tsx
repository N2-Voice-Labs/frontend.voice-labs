import Link from "next/link";
import "./motion.css";
import "./theme-dark.css";
import { MobileNavigation } from "@/components/features/landing/mobile-navigation";
import { AmbientBackground } from "@/components/features/landing/motion/ambient-background";
import { ThemeToggle } from "@/components/features/landing/theme/theme-toggle";
import { themeInitScript } from "@/components/features/landing/theme/theme";
import { LandingMotion } from "@/components/features/landing/motion/landing-motion";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="marketing-root" data-theme="light" suppressHydrationWarning>
    <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
    <a className="skip-link" href="#main-content">Skip to content</a>
    <AmbientBackground />
    <header className="marketing-header">
      <Link className="marketing-brand" href="/" aria-label="Voice Labs home"><span className="brand-glyph">v<span>.</span></span><span>voice labs</span></Link>
      <nav className="marketing-nav" aria-label="Main navigation">
        <a href="#product">Product</a>
        <a href="#how-it-works">How it works</a>
        <a href="#platform">Platform</a>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <Link className="header-access" href="/agents">Platform access <span aria-hidden="true">↗</span></Link>
        <MobileNavigation />
      </div>
    </header>
    {children}
    <footer className="marketing-footer"><Link className="marketing-brand footer-brand" href="/"><span className="brand-glyph">v<span>.</span></span><span>voice labs</span></Link><p>Make room for more voices.</p><div><a href="#product">Product</a><a href="#how-it-works">How it works</a><Link href="/agents">Open platform ↗</Link></div><span className="footer-copy">© 2026 Voice Labs</span></footer>
    <LandingMotion />
  </div>;
}
