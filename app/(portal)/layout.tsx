import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "../(dashboard)/navigation.css";
import "../(call)/call.css";
import "./portal.css";

// Same Hangul face as the call screens: the officer call (and its transcript) shows Korean.
const hangul = Noto_Sans_KR({ variable: "--font-hangul", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Inha Admissions Assistant (UNAI demo)", template: "%s · Inha Admissions Assistant" },
  description: "Ask about applying to Inha University by voice or chat, and talk to an admissions officer with live English–Korean translation. A UNAI demonstration.",
};

/** The customer portal: UNAI's first implementation, an admissions assistant for Inha University (demo). */
export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`call-root portal-root ${hangul.variable}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {children}
  </div>;
}
