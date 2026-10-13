# Voice Labs frontend

The Voice Labs frontend is a Next.js App Router application for the public product site, voice agents, the Voice Playground, and conversation history.

## Requirements

- Node.js 20.9 or newer
- npm
- The Platform API to load and save agents and conversations
- For live voice sessions: the Runtime API and a reachable LiveKit server

## Run locally

From this directory, install dependencies and create the local environment file:

```bash
npm ci
cp .env.example .env.local
```

Set `NEXT_PUBLIC_PLATFORM_URL` in `.env.local` to the URL of your Platform API. Its default value is `http://localhost:8000`.

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public landing page is at `/`; the workspace routes are `/agents` and `/conversations`.

The landing page works without backend services. Workspace pages need the Platform API. Starting a voice session also needs the Runtime API and LiveKit configured by the Platform. When the Platform API is unavailable, agent and conversation pages show an error state.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

## Browser tests

Install the Playwright Chromium browser once:

```bash
npx playwright install chromium
```

End-to-end tests use the sibling `../backend.voice-labs` repository to start the Platform and Runtime test services. They expect `uv` and the backend test dependencies to be available. The Playwright configuration points LiveKit at `ws://localhost:7880`; make sure that server is reachable with the development credentials configured by the test setup.

```bash
npm run test:e2e
```

To use a specific Chromium executable, set `CHROME_BIN`. To provide audio for browser tests, set `VOICE_TEST_AUDIO_FILE` to an audio file supported by Chromium's fake microphone input.
