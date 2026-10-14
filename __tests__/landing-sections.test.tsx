import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Comparison } from "@/components/features/landing/comparison";
import { ScreenshotGallery } from "@/components/features/landing/screenshot-gallery";
import { WorkspaceShowcase } from "@/components/features/landing/workspace-showcase";

test("showcase tabs switch the visible workspace area and support arrow keys", () => {
  render(<WorkspaceShowcase />);

  const configure = screen.getByRole("tab", { name: /Configure/ });
  const testLive = screen.getByRole("tab", { name: /Test live/ });
  const review = screen.getByRole("tab", { name: /Review/ });
  expect(configure.getAttribute("aria-selected")).toBe("true");
  const panel = (id: string) => document.getElementById(`showcase-panel-${id}`);
  // Inactive panels are `inert` (jsdom does not implement it, browsers hide them from AT and focus).
  expect(panel("agents")?.hasAttribute("inert")).toBe(false);
  expect(panel("playground")?.hasAttribute("inert")).toBe(true);

  fireEvent.click(testLive);
  expect(testLive.getAttribute("aria-selected")).toBe("true");
  expect(configure.getAttribute("aria-selected")).toBe("false");
  expect(panel("playground")?.hasAttribute("inert")).toBe(false);
  expect(panel("agents")?.hasAttribute("inert")).toBe(true);

  fireEvent.keyDown(testLive, { key: "ArrowDown" });
  expect(review.getAttribute("aria-selected")).toBe("true");
  expect(review.getAttribute("tabindex")).toBe("0");
  fireEvent.keyDown(review, { key: "Home" });
  expect(configure.getAttribute("aria-selected")).toBe("true");
});

test("comparison rows expand and collapse", () => {
  render(<Comparison />);

  const language = screen.getByRole("button", { name: /Language/ });
  const interruptions = screen.getByRole("button", { name: /Interruptions/ });
  expect(language.getAttribute("aria-expanded")).toBe("true");
  expect(interruptions.getAttribute("aria-expanded")).toBe("false");

  fireEvent.click(interruptions);
  expect(interruptions.getAttribute("aria-expanded")).toBe("true");
  expect(language.getAttribute("aria-expanded")).toBe("false");

  fireEvent.click(interruptions);
  expect(interruptions.getAttribute("aria-expanded")).toBe("false");
});

test("gallery motion can be paused and resumed", () => {
  const { container } = render(<ScreenshotGallery />);
  const gallery = container.querySelector(".gallery");

  const pause = screen.getByRole("button", { name: /Pause motion/ });
  expect(pause.getAttribute("aria-pressed")).toBe("false");
  expect(gallery?.getAttribute("data-paused")).toBe("false");

  fireEvent.click(pause);
  const play = screen.getByRole("button", { name: /Play motion/ });
  expect(play.getAttribute("aria-pressed")).toBe("true");
  expect(gallery?.getAttribute("data-paused")).toBe("true");

  // The looped copy is hidden from assistive technology.
  expect(container.querySelectorAll('.gallery-group[aria-hidden="true"]').length).toBe(1);
});
