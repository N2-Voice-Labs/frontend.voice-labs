import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { LandingPage } from "@/components/features/landing/landing-page";

test("every in-page anchor on the landing page points at an element that exists", () => {
  const { container } = render(<LandingPage />);
  const anchors = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];

  expect(anchors.length).toBeGreaterThan(0);
  for (const anchor of anchors) {
    const id = anchor.getAttribute("href")!.slice(1);
    expect(container.querySelector(`#${id}`), `#${id}`).not.toBeNull();
  }
});

test("section entrances are coordinated sequences, not independent reveals", () => {
  const { container } = render(<LandingPage />);

  // Every stepped element lives inside a sequence, and the old per-element hooks are gone.
  const stepped = container.querySelectorAll("[data-step]");
  expect(stepped.length).toBeGreaterThan(0);
  stepped.forEach((element) => expect(element.closest("[data-sequence]")).not.toBeNull());
  expect(container.querySelector("[data-reveal], [data-reveal-group], [data-reveal-item], [data-spotlight]")).toBeNull();

  // The masked headline reveal is reserved for the two headlines that carry the page.
  expect(container.querySelectorAll("[data-split]")).toHaveLength(2);
});

test("the page keeps one h1 and no removed sections", () => {
  const { container } = render(<LandingPage />);

  expect(container.querySelectorAll("h1")).toHaveLength(1);
  expect(container.querySelector(".process-section, .usecase-section")).toBeNull();
  expect(container.querySelector(".closing-uses")?.textContent?.toLowerCase()).toContain("customer care");
});
