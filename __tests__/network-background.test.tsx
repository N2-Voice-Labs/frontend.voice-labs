import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { NetworkBackground, modeForPath } from "@/components/features/dashboard/network-background";

afterEach(cleanup);

test("workspace areas pick the right mode", () => {
  expect(modeForPath("/agents")).toBe("signal");
  expect(modeForPath("/agents/")).toBe("signal");
  expect(modeForPath("/agents/abc123/test")).toBe("idle");
  expect(modeForPath("/agents/abc123")).toBe("active");
  expect(modeForPath("/agents/new")).toBe("active");
  expect(modeForPath("/conversations")).toBe("active");
});

test("renders a decorative canvas and survives environments without a 2D context", () => {
  // jsdom has no canvas: getContext returns null, so the component must simply do nothing.
  const { container } = render(<NetworkBackground mode="signal" />);
  const canvas = container.querySelector("canvas");

  expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  expect(canvas?.getAttribute("data-mode")).toBe("signal");
  expect(canvas?.classList.contains("network-bg")).toBe(true);
});
