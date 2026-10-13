import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const platformUrl = "http://127.0.0.1:8000";
const serviceToken = "browser-acceptance-service-token";

test("runs a browser voice session through LiveKit and persists its transcript and lifecycle", async ({ page, request }) => {
  const agentResponse = await request.post(`${platformUrl}/agents`, {
    data: {
      name: "Browser voice acceptance",
      system_prompt: "Use concise responses.",
      enabled_languages: ["en", "ru"],
    },
  });
  expect(agentResponse.status()).toBe(201);
  const agent = await agentResponse.json();

  await page.goto(`/agents/${agent.id}/test`);
  const sessionResponsePromise = page.waitForResponse((response) =>
    response.url() === `${platformUrl}/voice/sessions` && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start conversation" }).click();
  const sessionResponse = await sessionResponsePromise;
  expect(sessionResponse.status()).toBe(201);
  const session = await sessionResponse.json();
  expect(session.connection_status).toBe("configured");

  await expect(page.getByRole("status")).toContainText("Connected to LiveKit; microphone is on.", { timeout: 20_000 });
  await expect(page.getByText("synthetic ingress transcript")).toBeVisible({ timeout: 20_000 });

  const eventTypes = async () => {
    const response = await request.get(`${platformUrl}/conversations/${session.conversation_id}/runtime-state`);
    return (await response.json()).events.map((event: { event_type: string }) => event.event_type);
  };
  await expect.poll(eventTypes, { timeout: 15_000 }).toContain("AgentSpeechStarted");
  await expect.poll(eventTypes, { timeout: 15_000 }).toContain("AgentSpeechCancelled");
  await expect.poll(
    async () => (await eventTypes()).filter((eventType: string) => eventType === "TurnCompleted").length,
    { timeout: 15_000 },
  ).toBeGreaterThanOrEqual(2);
  await page.waitForFunction(() => {
    const audio = document.querySelector<HTMLAudioElement>("audio[data-voice-labs-audio]");
    return Boolean(audio && !audio.paused && audio.currentTime > 0);
  }, { timeout: 10_000 });
  const playbackEventsResponse = await request.get(`${platformUrl}/conversations/${session.conversation_id}/runtime-state`);
  const playbackEvents = (await playbackEventsResponse.json()).events.map(
    (event: { event_type: string }) => event.event_type,
  );
  const speechStartedAt = playbackEvents.indexOf("AgentSpeechStarted");
  const interruptedAt = playbackEvents.indexOf("UserInterrupted", speechStartedAt + 1);
  const speechCancelledAt = playbackEvents.indexOf("AgentSpeechCancelled", interruptedAt + 1);
  expect(speechStartedAt).toBeGreaterThanOrEqual(0);
  expect(interruptedAt).toBeGreaterThan(speechStartedAt);
  expect(speechCancelledAt).toBeGreaterThan(interruptedAt);

  const languageEventResponse = await request.post(`${platformUrl}/runtime/events`, {
    headers: { "X-Runtime-Token": serviceToken },
    data: {
      event_id: randomUUID(),
      event_type: "TranscriptFinal",
      schema_version: 1,
      session_id: session.session_id,
      conversation_id: session.conversation_id,
      agent_id: agent.id,
      payload: {
        content: "Мне нужна appointment",
        role: "user",
        primary_language: "ru",
        detected_languages: ["ru", "en"],
      },
    },
  });
  expect(languageEventResponse.status()).toBe(202);
  expect(await languageEventResponse.json()).toEqual({ status: "accepted" });

  for (const { eventType, activity } of [
    { eventType: "SpeechStarted", activity: "Listening to you" },
    { eventType: "SpeechStopped", activity: "Thinking" },
    { eventType: "AgentSpeechStarted", activity: "Agent speaking" },
    { eventType: "UserInterrupted", activity: "Interrupted; listening for your next turn" },
    { eventType: "AgentSpeechCancelled", activity: "Interrupted; listening for your next turn" },
  ]) {
    const activityEventResponse = await request.post(`${platformUrl}/runtime/events`, {
      headers: { "X-Runtime-Token": serviceToken },
      data: {
        event_id: randomUUID(),
        event_type: eventType,
        schema_version: 1,
        session_id: session.session_id,
        conversation_id: session.conversation_id,
        agent_id: agent.id,
        payload: {},
      },
    });
    expect(activityEventResponse.status()).toBe(202);
    expect(await activityEventResponse.json()).toEqual({ status: "accepted" });
    await expect(page.getByText(`Conversation activity: ${activity}`)).toBeVisible();
  }

  const runtimeStateResponse = await request.get(`${platformUrl}/conversations/${session.conversation_id}/runtime-state`);
  expect(runtimeStateResponse.ok()).toBeTruthy();
  const runtimeState = await runtimeStateResponse.json();
  expect(runtimeState.events).toContainEqual(expect.objectContaining({
    event_type: "RuntimeStarted",
    payload: expect.objectContaining({ room_name: session.room_name }),
  }));

  await page.getByRole("button", { name: "End conversation" }).click();
  await expect(page.getByRole("status")).toContainText("Session ended and saved.", { timeout: 15_000 });

  const [messagesResponse, finalStateResponse] = await Promise.all([
    request.get(`${platformUrl}/conversations/${session.conversation_id}/messages`),
    request.get(`${platformUrl}/conversations/${session.conversation_id}/runtime-state`),
  ]);
  const expectedMessages = [
    expect.objectContaining({ role: "user", content: "synthetic ingress transcript" }),
    expect.objectContaining({ role: "assistant", content: "This deterministic response stays active for interruption testing." }),
  ];
  if (!process.env.VOICE_TEST_AUDIO_FILE) {
    expectedMessages.push(expect.objectContaining({ role: "user", content: "synthetic barge-in transcript" }));
  }
  expect(await messagesResponse.json()).toEqual(expect.arrayContaining(expectedMessages));
  const finalState = await finalStateResponse.json();
  expect(finalState.session_status).toBe("ended");
  expect(finalState.events).toContainEqual(expect.objectContaining({ event_type: "SessionEnded" }));

  await page.getByRole("link", { name: "Open conversation history" }).click();
  await expect(page.getByRole("heading", { name: "Conversation" })).toBeVisible();
  await expect(page.getByText("synthetic ingress transcript")).toBeVisible();
  await expect(page.getByText(/user · ru: Мне нужна appointment/)).toBeVisible();
  await expect(page.getByText(/Detected: ru, en/)).toBeVisible();
  await expect(page.getByText("Мне нужна appointment")).toBeVisible();
});

test("ends and persists the session when the browser disconnects without an end request", async ({ page, request }) => {
  const agentResponse = await request.post(`${platformUrl}/agents`, {
    data: {
      name: "Browser disconnect acceptance",
      system_prompt: "Use concise responses.",
      enabled_languages: ["en"],
    },
  });
  expect(agentResponse.status()).toBe(201);
  const agent = await agentResponse.json();

  await page.goto(`/agents/${agent.id}/test`);
  const sessionResponsePromise = page.waitForResponse((response) =>
    response.url() === `${platformUrl}/voice/sessions` && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start conversation" }).click();
  const sessionResponse = await sessionResponsePromise;
  expect(sessionResponse.status()).toBe(201);
  const session = await sessionResponse.json();
  await expect(page.getByRole("status")).toContainText("Connected to LiveKit; microphone is on.", { timeout: 20_000 });

  const readRuntimeState = async () => {
    const response = await request.get(`${platformUrl}/conversations/${session.conversation_id}/runtime-state`);
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  await expect.poll(async () => {
    const state = await readRuntimeState();
    return state.events.some((event: { event_type: string }) => event.event_type === "RuntimeStarted");
  }, { timeout: 15_000 }).toBe(true);

  let endRequestObserved = false;
  page.on("request", (browserRequest) => {
    if (
      browserRequest.method() === "POST"
      && browserRequest.url() === `${platformUrl}/voice/sessions/${session.session_id}/end`
    ) {
      endRequestObserved = true;
    }
  });
  await page.goto("/");
  expect(endRequestObserved).toBe(false);

  await expect.poll(async () => (await readRuntimeState()).session_status, { timeout: 15_000 }).toBe("ended");
  const finalState = await readRuntimeState();
  expect(finalState.events).toContainEqual(expect.objectContaining({
    event_type: "SessionEnded",
    payload: expect.objectContaining({ reason: "participant_disconnected" }),
  }));
});
