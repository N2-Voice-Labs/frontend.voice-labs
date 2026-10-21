import { Noto_Sans_KR } from "next/font/google";
import "../(dashboard)/navigation.css";
import "./call.css";

// Self-hosted Hangul face for the call screens only, where Korean speech is the main content.
// No `korean` subset exists in next/font's data, so it is not preloaded; the browser fetches only the
// unicode-range slices for glyphs actually on screen. Scoped here so other pages carry none of its CSS.
const hangul = Noto_Sans_KR({ variable: "--font-hangul", display: "swap", preload: false });

/**
 * Layer A (communication): /call and /join. No background canvas or footer; a call gets the whole viewport
 * (UX spec §2.2, design system §5.3). Setup and ended screens show workspace navigation (call-nav.tsx);
 * the live call screen does not, because leaving the page drops the call.
 */
export default function CallLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`call-root ${hangul.variable}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {children}
  </div>;
}
