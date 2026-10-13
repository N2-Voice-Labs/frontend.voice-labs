import { expect, test } from "@playwright/test";

const platformUrl = "http://127.0.0.1:8000";

test("creates and edits an agent against Platform on a mobile viewport", async ({ page, request }) => {
  const configuredProvidersResponse = await request.get(`${platformUrl}/providers`);
  expect(configuredProvidersResponse.status()).toBe(200);
  const configuredProviders = await configuredProvidersResponse.json() as Array<{
    kind: string;
    provider: string;
  }>;

  for (const provider of [
    { kind: "stt", provider: "deepgram" },
    { kind: "stt", provider: "faster-whisper" },
    { kind: "llm", provider: "openai-compatible" },
    { kind: "llm", provider: "openai" },
    { kind: "tts", provider: "cartesia" },
  ]) {
    if (configuredProviders.some((configured) =>
      configured.kind === provider.kind && configured.provider === provider.provider
    )) continue;

    const response = await request.post(`${platformUrl}/providers`, {
      data: { ...provider, configuration: {}, enabled: true },
    });
    expect(response.status()).toBe(201);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/agents/new");
  await expect(page.getByRole("heading", { name: "Create an agent" })).toBeVisible();
  const unavailableProvider = page.getByRole("option", {
    name: "faster-whisper (not supported by Runtime)",
  });
  await expect.poll(() => unavailableProvider.evaluate((option) => (option as HTMLOptionElement).disabled)).toBe(true);

  await page.getByLabel("Agent name").fill("Immigration guide");
  await page.getByLabel("Description").fill("English and Russian assistance");
  await page.getByLabel("System prompt").fill("Give concise, careful guidance.");
  await page.getByLabel("Speech-to-text provider").selectOption({ label: "deepgram" });
  await page.getByLabel("Language model provider").selectOption({ label: "openai-compatible" });
  await page.getByLabel("Text-to-speech provider").selectOption({ label: "cartesia" });
  await page.getByRole("button", { name: "Create agent" }).click();

  await expect(page.getByRole("heading", { name: "Immigration guide" })).toBeVisible();
  await page.getByRole("link", { name: "Edit agent" }).click();
  await expect(page.getByRole("heading", { name: "Edit agent" })).toBeVisible();
  await page.getByLabel("Agent name").fill("Immigration guide EN-RU");
  await page.getByRole("checkbox", { name: "Russian" }).uncheck();
  await page.getByLabel("Language model provider").selectOption({ label: "openai" });
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { name: "Immigration guide EN-RU" })).toBeVisible();
  await expect(page.getByText("Languages: en")).toBeVisible();
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(390);

  await page.goto("/conversations");
  await expect(page.getByRole("heading", { name: "Conversations" })).toBeVisible();
  await expect(page.getByText("No conversations yet.")).toBeVisible();
});
