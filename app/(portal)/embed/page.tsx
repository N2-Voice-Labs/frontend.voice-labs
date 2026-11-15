import type { Metadata } from "next";
import { EmbedAssistant } from "@/components/features/portal/embed-assistant";

export const metadata: Metadata = {
  title: "Assistant",
  robots: { index: false, follow: false },
};

/** Loaded inside the iframe that /widget.js adds to a customer's website. */
export default function EmbedPage() {
  return <EmbedAssistant />;
}
