import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { VoicePreview } from "@/components/features/landing/voice-preview";

test("switches between clearly labeled conversation previews", () => {
  render(<VoicePreview />);

  const codeSwitching = screen.getByRole("button", { name: "Code-switching" });
  const turnTaking = screen.getByRole("button", { name: "Natural turn-taking" });
  expect(codeSwitching.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Мне нужно узнать what documents I need for my visa.")).toBeTruthy();

  fireEvent.click(turnTaking);
  expect(turnTaking.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Can you help me find a quieter time to call?")).toBeTruthy();
  expect(screen.queryByText("Мне нужно узнать what documents I need for my visa.")).toBeNull();

  fireEvent.click(codeSwitching);
  expect(codeSwitching.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Мне нужно узнать what documents I need for my visa.")).toBeTruthy();
});
