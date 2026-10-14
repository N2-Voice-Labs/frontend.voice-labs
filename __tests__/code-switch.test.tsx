import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { CodeSwitch } from "@/components/features/landing/code-switch";

afterEach(cleanup);

test("exposes the static English phrase to assistive tech and hides the animated copy", () => {
  const { container } = render(<h1>Voice AI that speaks your language. <em><CodeSwitch /></em></h1>);

  const readable = container.querySelector(".sr-only");
  const animated = container.querySelector("[aria-hidden='true']");
  expect(readable?.textContent).toBe("Even when you switch.");
  expect(animated?.textContent).toBe("Even when you switch.");
  expect(container.querySelector(".code-switch")?.getAttribute("data-lang")).toBe("en");
});

test("tags the animated copy with its language so fonts and assistive tech can shape it", () => {
  const { container } = render(<h1><CodeSwitch /></h1>);
  expect(container.querySelector("[aria-hidden='true']")?.getAttribute("lang")).toBe("en");
});

test("splits the phrase into whole words made of letters so they can ripple", () => {
  const { container } = render(<h1><CodeSwitch /></h1>);
  const words = [...container.querySelectorAll("[aria-hidden='true'] .cs-word")].map((word) => word.textContent);

  expect(words).toEqual(["Even", "when", "you", "switch."]);
  expect(container.querySelectorAll(".cs-char").length).toBe("Evenwhenyouswitch.".length);
});
