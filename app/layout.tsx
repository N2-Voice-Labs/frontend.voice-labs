import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
import "./theme-shared.css";
import { themeInitScript } from "@/components/features/landing/theme/theme";

const display = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-display", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Voice Labs — Voice AI for real conversations", template: "%s · Voice Labs" },
  description: "Create voice agents that follow the conversation across English, Russian, and the spaces in between.",
  openGraph: { type: "website", siteName: "Voice Labs" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
    <body>{children}</body>
  </html>;
}
