import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AgentBrowser } from "@/components/features/agents/agent-browser";
import type { AgentCardData } from "@/lib/agent-view";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

afterEach(cleanup);

const card = (over: Partial<AgentCardData>): AgentCardData => ({
  id: "x", name: "X", description: "", status: "active", languages: ["en"],
  overrides: { stt: false, llm: false, tts: false }, conversations: 0, lastActive: null, lastActiveAt: null, hue: 100, ...over,
});

const agents = [
  card({ id: "1", name: "Immigration guide", description: "Visa help", languages: ["en", "ru"], conversations: 3, lastActive: "5 min ago", lastActiveAt: 3 }),
  card({ id: "2", name: "Concierge", status: "draft", lastActiveAt: 2, conversations: 1, lastActive: "2 h ago" }),
  card({ id: "3", name: "Appointments", status: "draft", languages: ["ru"] }),
];

const names = () => screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

test("lists agents by recent activity with one-click Talk and Edit links", () => {
  render(<AgentBrowser agents={agents} />);
  expect(names()).toEqual(["Immigration guide", "Concierge", "Appointments"]);
  expect(screen.getByRole("link", { name: "Talk to Immigration guide" }).getAttribute("href")).toBe("/agents/1/test");
  expect(screen.getByRole("link", { name: "Edit Concierge" }).getAttribute("href")).toBe("/agents/2/edit");
  expect(screen.getByText("3 conversations · 5 min ago")).toBeTruthy();
});

test("filters by status chip and by search, including language names", () => {
  render(<AgentBrowser agents={agents} />);

  fireEvent.click(screen.getByRole("button", { name: /Draft/ }));
  expect(names()).toEqual(["Concierge", "Appointments"]);
  expect(screen.getByRole("status").textContent).toBe("Showing 2 of 3 agents");

  fireEvent.click(screen.getByRole("button", { name: /All/ }));
  fireEvent.change(screen.getByPlaceholderText("Search agents"), { target: { value: "russian" } });
  expect(names()).toEqual(["Immigration guide", "Appointments"]);
});

test("shows a clearable empty state when nothing matches", () => {
  render(<AgentBrowser agents={agents} />);
  fireEvent.change(screen.getByPlaceholderText("Search agents"), { target: { value: "zzzz" } });
  expect(screen.getByText("No agents match your search")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(names()).toHaveLength(3);
});

test("sorts by name and describes provider overrides for assistive tech", () => {
  render(<AgentBrowser agents={[{ ...agents[0], overrides: { stt: true, llm: false, tts: false } }, agents[1]]} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "name" } });
  expect(names()).toEqual(["Concierge", "Immigration guide"]);
  const first = screen.getAllByRole("listitem")[1];
  expect(within(first).getByRole("img").getAttribute("aria-label")).toBe("Speech: custom provider, Language: runtime default, Voice: runtime default");
});

test("the / key focuses search unless you are already typing", () => {
  render(<AgentBrowser agents={agents} />);
  const input = screen.getByPlaceholderText("Search agents");
  fireEvent.keyDown(window, { key: "/" });
  expect(document.activeElement).toBe(input);
});
