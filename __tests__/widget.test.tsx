import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("@/components/features/portal/assistant-panel", () => ({ AssistantPanel: () => <section>assistant</section> }));

import { EmbedAssistant } from "@/components/features/portal/embed-assistant";
import { bookmarkletFor, snippetFor } from "@/components/features/portal/widget-install";

const WIDGET = readFileSync(join(process.cwd(), "public/widget.js"), "utf8");

/** Runs widget.js as if loaded by <script src="https://portal.example/widget.js" ...attrs>. */
function load(attrs: Record<string, string> = {}) {
  const script = document.createElement("script");
  script.setAttribute("src", "https://portal.example/widget.js");
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  document.body.appendChild(script);
  Object.defineProperty(document, "currentScript", { configurable: true, get: () => script });
  new Function(WIDGET)();
  Object.defineProperty(document, "currentScript", { configurable: true, get: () => null });
}
const shadow = () => document.querySelector("[data-unai-widget]")!.shadowRoot!;

beforeEach(() => {
  document.body.innerHTML = "";
  sessionStorage.clear();
  delete (window as { UNAIWidget?: unknown }).UNAIWidget;
});
afterEach(cleanup);

test("the launcher opens the assistant iframe from the script's own origin, with the microphone allowed", () => {
  load({ "data-label": "Ask Inha" });
  const launch = shadow().querySelector("button.launch") as HTMLButtonElement;
  expect(launch.textContent).toContain("Ask Inha");
  expect(shadow().querySelector("iframe")).toBeNull(); // not loaded until someone opens it
  launch.click();
  const frame = shadow().querySelector("iframe")!;
  expect(frame.getAttribute("src")).toBe("https://portal.example/embed");
  expect(frame.getAttribute("allow")).toContain("microphone");
  expect((shadow().querySelector(".panel") as HTMLElement).hidden).toBe(false);
  expect(launch.getAttribute("aria-expanded")).toBe("true");
});

test("only the portal's own close message hides the panel, and it keeps the iframe (a call keeps running)", () => {
  load({ "data-open": "true" });
  const panel = shadow().querySelector(".panel") as HTMLElement;
  expect(panel.hidden).toBe(false);
  window.dispatchEvent(new MessageEvent("message", { origin: "https://evil.example", data: { type: "unai:close" } }));
  expect(panel.hidden).toBe(false);
  window.dispatchEvent(new MessageEvent("message", { origin: "https://portal.example", data: { type: "unai:close" } }));
  expect(panel.hidden).toBe(true);
  expect(shadow().querySelector("iframe")).not.toBeNull();
});

test("loading it again (the bookmarklet's second click) toggles instead of adding a second widget", () => {
  load();
  load();
  expect(document.querySelectorAll("[data-unai-widget]")).toHaveLength(1);
  expect((shadow().querySelector(".panel") as HTMLElement).hidden).toBe(false);
});

test("a label with markup is shown as text", () => {
  load({ "data-label": "<img src=x onerror=alert(1)>" });
  expect(shadow().querySelector("img")).toBeNull();
});

test("the embedded panel's close button tells the parent page to hide it", () => {
  const post = vi.spyOn(window.parent, "postMessage");
  render(<EmbedAssistant />);
  fireEvent.click(screen.getByRole("button", { name: "Close the assistant" }));
  expect(post).toHaveBeenCalledWith({ type: "unai:close" }, "*");
});

test("install snippet and bookmarklet point at this portal's widget.js", () => {
  expect(snippetFor("https://portal.example")).toBe('<script src="https://portal.example/widget.js" async></script>');
  const bm = bookmarkletFor("https://portal.example");
  expect(bm.startsWith("javascript:")).toBe(true);
  expect(bm).toContain("https://portal.example/widget.js");
});

test("an open panel comes back open after a refresh or a click to another page (same tab)", () => {
  sessionStorage.clear();
  load();
  (shadow().querySelector("button.launch") as HTMLButtonElement).click();
  expect(sessionStorage.getItem("unai-widget-open")).toBe("1");
  // A new page load: the DOM and window state are gone, sessionStorage stays.
  document.body.innerHTML = "";
  delete (window as { UNAIWidget?: unknown }).UNAIWidget;
  load();
  expect((shadow().querySelector(".panel") as HTMLElement).hidden).toBe(false);
  window.dispatchEvent(new MessageEvent("message", { origin: "https://portal.example", data: { type: "unai:close" } }));
  expect(sessionStorage.getItem("unai-widget-open")).toBeNull();
});
