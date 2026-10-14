import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AnimatedVoiceOrb } from "@/components/features/landing/animated-voice-orb";
import { overallLevel, spectrumToBars } from "@/components/features/landing/voice-input";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("spectrumToBars maps a byte spectrum into 0..1 bars and silence stays near zero", () => {
  const loud = spectrumToBars(new Uint8Array(128).fill(255), 11);
  expect(loud).toHaveLength(11);
  expect(Math.max(...loud)).toBe(1);
  expect(overallLevel(loud)).toBeGreaterThan(0.9);

  const quiet = spectrumToBars(new Uint8Array(128).fill(4), 11);
  expect(overallLevel(quiet)).toBe(0);
  expect(overallLevel([])).toBe(0);
});

test("the Speak to it control only appears where a microphone exists, and explains a blocked microphone", async () => {
  const none = render(<AnimatedVoiceOrb />);
  await waitFor(() => expect(none.container.querySelector(".hero-art")).toBeTruthy());
  expect(screen.queryByRole("button", { name: "Speak to it" })).toBeNull();
  cleanup();

  const getUserMedia = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"));
  vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getUserMedia } });
  render(<AnimatedVoiceOrb />);
  fireEvent.click(await screen.findByRole("button", { name: "Speak to it" }));
  await waitFor(() => expect(screen.getByText(/Microphone blocked/)).toBeTruthy());
  expect(getUserMedia).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Speak to it" }).getAttribute("aria-pressed")).toBe("false");
});
