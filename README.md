# UNAI frontend (repository: frontend.voice-labs)

> **UNAI** (formerly Voice Labs) is a B2B AI communication platform: AI voice agents (primary), real-time translation, AI chatbots and developer APIs. First market: university admissions offices. First MVP: the AI Admissions Assistant for international students at Inha University. Calls run in the browser over WebRTC (LiveKit); telephone/SIP calling is deferred.

This repository is the **Inha University Admissions portal**: UNAI's first customer-style implementation (confirmed 2026-11-12). It is a Next.js App Router application with the student-facing AI Admissions Assistant (voice call and chat), the `/staff` console for admissions officers, the translated `/call` and `/join` flow, and the agent workspace. The UNAI marketing site is the separate `frontend` repository.

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

## Website widget

Any site can add the admissions assistant with one line (served by this app from `public/widget.js`):

```html
<script src="https://<portal address>/widget.js" async></script>
```

It adds an "Ask Admissions" button that opens the assistant (voice, chat, officer hand-off) in an iframe
loaded from `/embed`, so the host site's CSS and scripts can't affect it. Options: `data-label`,
`data-position="left"`, `data-open="true"`. `/widget` is the install page for a university's web team,
with a bookmarklet that previews the widget on their live site (only in the browser that clicks it).
The panel's open state and the chat are kept for the browser tab, so they survive a refresh or a click to
another page of the same site (a voice call in progress ends with the page).

For longer demos on a site we don't control, `/widget` also offers a small Chrome extension
(`/unai-demo-extension.zip`, built by `lib/demo-extension.ts` with this portal's address filled in) that adds the
widget to every page of the listed sites (default: Inha's two admissions sites), in that browser only. It uses two
content scripts because Chrome blocks remote scripts added from an extension's isolated world.

Checked 2026-11-14 in Chromium: on a separate-origin page (voice call answered inside the widget), at phone width,
and on apply.inha.ac.kr with the extension (widget reopened with its chat after a refresh and after navigating to
another page). apply.inha.ac.kr sends no CSP or Permissions-Policy that would block it.

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
