import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Voice Labs — Voice AI for real conversations", template: "%s · Voice Labs" },
  description: "Create voice agents that follow the conversation across English, Russian, and the spaces in between.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
