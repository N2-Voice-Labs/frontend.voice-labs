"use client";

import { AssistantPanel } from "./assistant-panel";

/** Message the parent page's widget script listens for (see public/widget.js). */
export const CLOSE_MESSAGE = { type: "unai:close" } as const;

/**
 * The assistant alone, filling an iframe that public/widget.js opens on a customer's site.
 * Voice, chat and the hand-off to an officer all run inside the frame; closing only hides it,
 * so a call in progress keeps going while the visitor reads the page.
 */
export function EmbedAssistant() {
  return (
    <main className="portal-embed" id="main-content">
      <button
        type="button"
        className="portal-embed-close"
        aria-label="Close the assistant"
        onClick={() => window.parent?.postMessage(CLOSE_MESSAGE, "*")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
      <AssistantPanel />
      <p className="portal-embed-foot">Powered by UNAI · answers come from the university&apos;s published admissions information</p>
    </main>
  );
}
