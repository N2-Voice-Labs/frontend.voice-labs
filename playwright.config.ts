import { defineConfig } from "@playwright/test";

const platformUrl = "http://127.0.0.1:8000";
const runtimeUrl = "http://127.0.0.1:8001";
const webUrl = "http://127.0.0.1:3000";
const livekitUrl = "ws://localhost:7880";
const serviceToken = "browser-acceptance-service-token";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: webUrl,
    browserName: "chromium",
    launchOptions: {
      ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}),
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        "--autoplay-policy=no-user-gesture-required",
        ...(process.env.VOICE_TEST_AUDIO_FILE
          ? [`--use-file-for-fake-audio-capture=${process.env.VOICE_TEST_AUDIO_FILE}`]
          : []),
      ],
    },
    permissions: ["microphone"],
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "uv run --directory ../backend.voice-labs/platform --extra test uvicorn src.platform.main:app --host 127.0.0.1 --port 8000",
      url: `${platformUrl}/health`,
      env: {
        PLATFORM_DATABASE_URL: "sqlite://",
        PLATFORM_AUTO_CREATE_SCHEMA: "1",
        PLATFORM_WEB_ORIGIN: webUrl,
        RUNTIME_API_URL: runtimeUrl,
        PLATFORM_RUNTIME_TOKEN: serviceToken,
        LIVEKIT_URL: livekitUrl,
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "secret",
      },
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "PYTHONPATH=. uv run --directory ../backend.voice-labs/runtime --extra voice --extra test python tests/playwright_server.py",
      url: `${runtimeUrl}/health`,
      env: {
        RUNTIME_PLATFORM_URL: platformUrl,
        RUNTIME_PLATFORM_TOKEN: serviceToken,
        LIVEKIT_URL: livekitUrl,
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "secret",
        DEEPGRAM_API_KEY: "integration-test-stub",
        OPENAI_API_KEY: "integration-test-stub",
        CARTESIA_API_KEY: "integration-test-stub",
        CARTESIA_VOICE_ID: "integration-test-stub",
        VOICE_TEST_AUDIO_FILE: process.env.VOICE_TEST_AUDIO_FILE ?? "",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
      url: webUrl,
      env: { NEXT_PUBLIC_PLATFORM_URL: platformUrl },
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
