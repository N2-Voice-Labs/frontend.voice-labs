import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Manrope } from "next/font/google";
import "./tokens.css";
import "./globals.css";
import "./theme-shared.css";
import { themeInitScript } from "@/components/features/landing/theme/theme";

const display = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-display", display: "swap" });
// DM Sans has no Cyrillic. Without its metric-adjusted Arial fallback in --font-sans, Cyrillic text
// falls through to Manrope (second in --sans, tokens.css) instead of to Arial.
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap", adjustFontFallback: false });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
// Noto Sans KR is loaded only by the call layout (app/(call)/layout.tsx): its 120+ unicode-range
// @font-face rules would otherwise add ~26 KB gz of render-blocking CSS to every page. Elsewhere,
// Hangul uses the system faces in the --sans / --display stacks (tokens.css).

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "UNAI: AI voice agents for real conversations", template: "%s · UNAI" },
  description: "UNAI workspace and the Inha Admissions Assistant demo: AI voice agents, real-time translation and chat.",
  openGraph: { type: "website", siteName: "UNAI" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
    <body>{children}</body>
  </html>;
}
