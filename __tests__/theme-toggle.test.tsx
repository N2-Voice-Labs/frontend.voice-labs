import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { ThemeToggle } from "@/components/features/landing/theme/theme-toggle";
import { THEME_KEY } from "@/components/features/landing/theme/theme";

function renderInRoot() {
  return render(<div className="marketing-root" data-theme="light"><ThemeToggle /></div>);
}

beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); window.localStorage.clear(); });

test("toggles the marketing theme and remembers the choice", () => {
  const { container } = renderInRoot();
  const root = container.querySelector(".marketing-root")!;
  const toggle = screen.getByRole("switch", { name: "Dark theme" });

  expect(toggle.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(toggle);
  expect(root.getAttribute("data-theme")).toBe("dark");
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");

  fireEvent.click(toggle);
  expect(root.getAttribute("data-theme")).toBe("light");
  expect(window.localStorage.getItem(THEME_KEY)).toBe("light");
});

test("restores a saved theme on mount", () => {
  window.localStorage.setItem(THEME_KEY, "dark");
  const { container } = renderInRoot();
  expect(container.querySelector(".marketing-root")!.getAttribute("data-theme")).toBe("dark");
  expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
});
