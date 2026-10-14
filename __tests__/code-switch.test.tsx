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
