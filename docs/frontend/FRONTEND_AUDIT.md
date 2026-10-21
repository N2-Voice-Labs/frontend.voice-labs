# Voice Labs frontend audit

Audit date: 2026-10-21. Agent 1 of 5 (codebase onboarding) in the redesign workflow.
Scope: `frontend.voice-labs` at `08c6a47` (clean tree). For the gap analysis, the sibling
`backend.voice-labs` (Platform + Runtime) was also read. It was not modified. Its working tree has
uncommitted changes, including `platform/src/platform/main.py` and `analytics.py`, so treat backend
line numbers as a snapshot.

Everything below comes from reading code. Paths are relative to the frontend repo unless they are
prefixed with `backend.voice-labs/`.

---

## 0. Summary in three levels

**One line.** A Next.js 16 App Router app with two parts: a marketing landing page, and a workspace
where people configure AI voice agents and talk to one of them at a time in a browser "Voice
Playground" over LiveKit.

**Five-minute version.**

- **What the code does**: CRUD for agents, voices, deployments, tools, knowledge, campaigns and
  outcomes against the Platform REST API. One live voice flow: browser ↔ AI agent in a LiveKit room.
  Read-only views of conversation history and analytics.
- **Inputs**: Platform JSON over `fetch` (`lib/platform.ts:78`), LiveKit room events
  (`app/(dashboard)/agents/[id]/test/page.tsx:251-324`), and the microphone via `getUserMedia`
  (`page.tsx:214`).
- **Outputs**: Platform mutations, remote audio played through `<audio data-voice-labs-audio>`
  elements appended to `document.body` (`page.tsx:257-261`), and polled transcripts.
- **Key files**: `lib/platform.ts` (all HTTP), `app/(dashboard)/agents/[id]/test/page.tsx` (all of
  LiveKit), `components/features/playground/*` (stage, pipeline check, latency),
  `app/(dashboard)/conversations/[id]/page.tsx` (history transcript).

**The finding that changes scope.** The frontend models a human-to-AI call. The backend already has
a two-person interpreter mode: per-listener translation tracks, guest participants, a language for
each speaker, and an optional voice for each speaker. The frontend does not use any of it. The
redesign's main screen, a Korean ↔ English call between two people, is supported by the backend
contract, but the frontend has no types, API calls or UI for it. Some pieces are also missing from
the Platform API itself: invite/join, live transcript push, and speaker identity on stored messages.
See §6.

---

## 1. Architecture overview

### 1.1 Framework and tooling

| Item | Value (installed) | Evidence |
| --- | --- | --- |
| Next.js | 16.3.8, Turbopack, App Router | `package.json`, `next.config.ts` (`distDir` `.next-dev` in dev) |
| React | 19.3.0 (`latest` range) | `package.json` |
| TypeScript | 5.9.3, `tsc --noEmit` | `package.json` scripts |
| LiveKit | `livekit-client` 2.22.4 (`latest` range) | only import: `app/(dashboard)/agents/[id]/test/page.tsx:5` |
| Motion | `gsap` 3.15, `animejs` 4.5, `lenis` 1.3 | landing page only, see §8 |
| Deploy | `@opennextjs/cloudflare` + `wrangler`, also a `Dockerfile` / `compose.yml` | `package.json`, `wrangler.jsonc` |
| Tests | Vitest 5 + jsdom + Testing Library, Playwright e2e | `vitest.config.mts`, `playwright.config.ts` |

There is no state-management library, no data-fetching library, no UI/component library and no
CSS framework. Styling is hand-written global CSS. AGENTS.md forbids adding a design-system library.

### 1.2 Routing

Two route groups share `app/layout.tsx`, which loads fonts, `globals.css`, `theme-shared.css`, and
an inline theme-init script (`app/layout.tsx:21`).

- `app/(marketing)/` – `/` landing. Layout: header nav, theme toggle, mobile nav, `LandingMotion`
  (GSAP + Lenis) (`app/(marketing)/layout.tsx`).
- `app/(dashboard)/` – workspace. Layout (`app/(dashboard)/layout.tsx:8-15`):
  `DashboardBackground` canvas, `DashboardHeader` (7 top-nav links), `CommandPalette` (⌘K), footer.

Build output (`npm run build`, run during this audit, succeeded):

```
○ /  ○ /agents/new  ○ /analytics  ○ /campaigns  ○ /campaigns/new  ○ /conversations
○ /knowledge  ○ /tools  ○ /voices  ○ /voices/clone  ○ /voices/design
ƒ /agents  ƒ /agents/[id]  ƒ /agents/[id]/edit  ƒ /agents/[id]/test  ƒ /campaigns/[id]  ƒ /conversations/[id]
```

### 1.3 Data flow

- **One HTTP choke point**: `request<T>()` in `lib/platform.ts:78-93`. It prefixes
  `NEXT_PUBLIC_PLATFORM_URL` (default `http://localhost:8000`, `lib/platform.ts:1`), sets
  `cache: "no-store"`, turns FastAPI `detail` into `Error.message` and attaches `status`. Each
  domain module (`lib/voices.ts`, `lib/campaigns.ts`, `lib/deployments.ts`, `lib/tools.ts`,
  `lib/knowledge.ts`, `lib/templates.ts`, `lib/analytics.ts`) builds on it.
  - Exception: `previewVoice` calls `fetch` directly (`lib/voices.ts:53-58`).
- **No auth header is ever sent.** `request()` does not set `Authorization`. The Platform enforces
  Bearer auth whenever `PLATFORM_API_KEYS` is set (`backend.voice-labs/platform/src/platform/auth.py:134-162`).
  So the frontend only works against a Platform that has auth disabled. The `session_token` returned
  by `POST /voice/sessions` (`backend…/main.py:766`) is dropped: it is not in the `VoiceSession`
  type at `lib/platform.ts:3-10`.
- **Three fetch styles are mixed:**
  1. Server components: `/agents` (`app/(dashboard)/agents/page.tsx:21`) and `/agents/[id]`
     (`agents/[id]/page.tsx:14-18`). These fetch from the Next server using the same
     `NEXT_PUBLIC_PLATFORM_URL` as the browser.
  2. `useResource()` hook (`lib/use-resource.ts:10-38`). Loads on mount, optional interval, guards
     against stale responses. Used by analytics, campaigns, voices, tools, knowledge and panels.
  3. Hand-written `useEffect` + `setTimeout`/`setInterval` loops: playground, conversations list,
     conversation detail.
- **Error copy**: `describeError()` maps Platform `detail` codes to sentences
  (`lib/platform-errors.ts:1-42`). Not every page uses it. For example, the conversations pages and
  the agent edit page print the raw `message`.
- **Feature flags**: `lib/capabilities.ts`. Every flag is `false` by default. They can be switched on
  with `NEXT_PUBLIC_CAPABILITIES`, and they drive the "Coming soon" labels
  (`components/features/workspace/ui.tsx:21-31`).

### 1.4 Platform API surface the frontend uses

| Module | Calls |
| --- | --- |
| `lib/platform.ts` | `GET /agents`, `GET /agents/{id}`, `POST /agents`, `PATCH /agents/{id}`, `GET /providers`, `GET /conversations`, `GET /conversations/{id}`, `GET /conversations/{id}/runtime-state`, `GET /conversations/{id}/messages`, `PUT /conversations/{id}/outcome`, `POST /voice/sessions` (body `{agent_id}` only), `POST /voice/sessions/{id}/ensure-running`, `POST /voice/sessions/{id}/end` |
| `lib/voices.ts` | `GET /voices`, `GET /voices/{id}`, `POST /voices/clone`, `POST /voices/design`, `PATCH /voices/{id}`, `POST /voices/{id}/status`, `DELETE /voices/{id}`, `POST /voices/{id}/preview` (gated off) |
| `lib/deployments.ts` | `GET/POST /deployments`, `PATCH/DELETE /deployments/{id}` |
| `lib/tools.ts` / `lib/knowledge.ts` | tool and document CRUD, `GET/PUT /agents/{id}/tools`, `GET/PUT /agents/{id}/knowledge` |
| `lib/templates.ts` | `GET /agent-templates`, `POST /agent-templates/{key}/agents` |
| `lib/campaigns.ts` | campaigns CRUD, targets, `POST /campaigns/{id}/status` |
| `lib/analytics.ts` | `GET /analytics/summary` |

**Platform routes that exist but are not used** (`backend…/main.py`, `voices.py`, `campaigns.py`):

- `POST /voice/sessions/{id}/participants` (`main.py:811`, two-person interpreter calls)
- `GET /voice/sessions/{id}` (`main.py:793`)
- `DELETE /agents/{id}` (`main.py:502`)
- `POST /providers` (`main.py:511`)
- `POST /voices` (`voices.py:144`)
- `POST /voices/{id}/provision` (`voices.py:349`)
- `POST /campaigns/{id}/dial-next` (`campaigns.py:361`)
- `GET /deployments/{id}`, `GET /tools/{id}`, `GET /knowledge/documents/{id}`

**Agent fields the Platform accepts but the frontend `Agent` type lacks** (`lib/platform.ts:12-25`
compared with `backend…/main.py:274-287`):

- `mode` (`"agent" | "interpreter"`)
- `interpreter` (`languages[2]`, `direction`, `engine`, `latency_mode`, `hear_original`, `glossary`)
- `translation` (`working_language`, `caller_languages`, `glossary`)

### 1.5 LiveKit join flow (`app/(dashboard)/agents/[id]/test/page.tsx`)

1. `start()` (`:190`) resets state, then checks for `navigator.mediaDevices.getUserMedia` (`:208`).
2. **Permission probe**: `getUserMedia({audio:true})` (`:214`). It maps `NotAllowedError`,
   `SecurityError` and `NotFoundError` to readable errors (`:216-222`), then **stops the probe
   tracks immediately** (`:225`). The real mic track is created later by LiveKit.
3. `createVoiceSession(params.id)` (`:229`), which POSTs `{agent_id}`. It stores `session_id`,
   `conversation_id` and `runtime_status` (`:237-243`). It throws if `connection.url` or `token` is
   empty (`:245-247`).
4. `new Room()` with default options (`:249`). There is no `adaptiveStream`, `dynacast`,
   `audioCaptureDefaults` or device selection.
5. Handlers:
   - `TrackSubscribed` (`:251-276`): each **audio** track is `attach()`ed, appended to
     `document.body` with `data-voice-labs-audio`, and `play()` is called. A rejected play sets
     `audioPlaybackError` (`:267`). Video tracks are ignored. There is no per-participant routing,
     no volume control, and `room.startAudio()` is never called.
   - `TrackUnsubscribed` (`:277-279`): detach and remove.
   - `ActiveSpeakersChanged` (`:280-288`): sets `microphoneActive` to true if any local speaker and
     `agentSpeaking` to true if **any non-local** speaker. Levels come from `speaker.audioLevel`
     (max per side).
   - `Reconnecting` / `Reconnected` (`:289-298`): phase changes plus a status message.
   - `Disconnected` (`:299-324`): removes all `[data-voice-labs-audio]` elements. If the disconnect
     was not intentional, it calls `endVoiceSession` and shows "Retry end session" on failure.
6. `room.connect(url, token)` (`:326`), then
   `localParticipant.setMicrophoneEnabled(true)` (`:334`). Status changes to "Connected to LiveKit;
   microphone is on." (`:337`).
7. End: `finishSession()` (`:159-188`) disconnects the room, then `POST …/end`. If ending fails it
   keeps the session id so the user can retry.
8. Unmount (`:60-72`) disconnects and ends the session. Late-resolving promises check `mountedRef`
   throughout, and 8 unit tests cover these races.

**LiveKit events and APIs that are not used:** `ParticipantConnected`/`Disconnected`,
`TrackMuted`/`Unmuted`, `ConnectionQualityChanged`, `ConnectionStateChanged`, `AudioPlaybackStatusChanged`,
`DataReceived`, `TranscriptionReceived`, text streams, participant attributes/metadata,
`room.remoteParticipants`, `switchActiveDevice`, `getLocalDevices`, and mute/unmute.

### 1.6 Runtime state, transcripts, translation

- **Polling, not push.** Once a `conversationId` exists, an effect (`page.tsx:74-157`) fetches
  `getConversation`, `getConversationRuntimeState` and `getMessages` in parallel. It repeats every
  **1.5 s** while the conversation is `created`/`active` (`:146`), and every 3 s after a failure
  while connected (`:148`). The effect depends on `[conversationId, conversationStatus, phase]`, so
  every phase change tears down the loop and starts a new one.
- **Runtime recovery**: it calls `ensureVoiceSessionRunning` with backoff (3 s while `created`,
  15 s while `running`, 10 s after `not_configured`/`manual_start_required`/error) (`:98-121`).
- **"Conversation activity"** is the latest of 9 runtime event types, mapped to labels
  (`page.tsx:25-35`, `:91-96`). It lags by up to the 1.5 s poll plus Runtime → Platform delivery.
- **Stage mode**: `deriveStageMode` (`components/features/playground/voice-stage.tsx:24-38`) uses
  LiveKit speaker flags first, then the persisted "Thinking" label.
- **Transcript**: `ConversationMessage { role, content, primary_language, detected_languages, created_at }`
  (`lib/platform.ts:54-61`), rendered as a flat `<ol>` (`page.tsx:437-448`). Only finalized messages
  exist. There are no interim/partial transcripts anywhere in the stack: the Runtime event set has no
  interim type (`backend…/runtime/src/runtime/events.py:10-26`).
- **Translation**: **there is no translation concept in the frontend.**
  - `grep -ri translat` over `app components lib` finds only the word "Translate" in a code comment.
  - Language display is limited to `primary_language` / `detected_languages` tags
    (`components/features/conversations/language-tags.tsx`).
  - A Cyrillic/Latin script tint (`components/features/conversations/script-text.tsx`) marks code
    switching.
  - Languages offered are hard-coded to **en and ru only**, in three places: `lib/languages.ts:2-5`,
    `components/agent-form.tsx:16-19`, and `components/features/agents/agent-browser.tsx:16`.
- **Latency**: `latestLatency()` (`lib/latency.ts:18-28`) only accepts metrics named exactly
  `stt|llm|tts`, read from runtime-state events. This can never show data, for two reasons:
  1. The runtime-state endpoint filters `LatencyMeasured` out
     (`backend…/main.py:1074-1127`; the list omits it).
  2. The Runtime emits metrics named `stt_ttfb`, `llm_ttfb`, `tts_ttfb`, `turn_to_first_audio`,
     `translation_ms` and so on (`backend…/platform/src/platform/analytics.py:18`,
     `backend…/runtime/src/runtime/interpreter.py:851-860`).

  The analytics page has the same key mismatch (`app/(dashboard)/analytics/page.tsx:66` reads
  `data.latency["stt"]`). The `capabilities.ts:9` comment saying "Runtime does not emit
  LatencyMeasured yet" is stale.

---

## 2. Existing pages

### `/` – Landing (`app/(marketing)/page.tsx` → `components/features/landing/landing-page.tsx`)

- **Purpose**: marketing site. The headline is "Voice AI that speaks your language", about agents
  that follow EN/RU code-switching (`landing-page.tsx:33-36`).
- **UX**:
  - Hero with an animated orb (`AnimatedVoiceOrb`, anime.js) and an opt-in "Speak to it" mic
    visualizer (AnalyserNode only, nothing sent).
  - `HeroNetwork` canvas; a `CodeSwitch` word animation.
  - Sections for preview tabs, capabilities, a pinned `WorkspaceShowcase` (GSAP ScrollTrigger),
    facts, `Comparison` against phone menus, `ScreenshotGallery`, and a closing CTA.
  - Lenis smooth scroll.
- **Problems vs. brief**:
  - The positioning is "AI agents that handle EN/RU callers", not "people talking across
    languages". A new user would read it as a voice-bot builder.
  - Heavy motion (pinning, scrubbing, parallax, split text, canvas, orb), which the brief warns
    against ("huge hero animations").
  - The CTA "Try live voice" goes to `/agents`, not to a call.
- **Preserve**:
  - Skip link (`app/(marketing)/layout.tsx:11`).
  - Single h1 and in-page anchor integrity, which tests check (`__tests__/landing-structure.test.tsx`).
  - Reduced-motion handling (`components/features/landing/motion/gsap.ts:11-20`).
  - The theme toggle and no-flash theme script.

### `/agents` – Agent list (server component, `app/(dashboard)/agents/page.tsx`)

- **Purpose**: workspace home.
- **UX**: four count-up stats (Agents, Live, Conversations, Last conversation), then `AgentBrowser`.
  `AgentBrowser` has search with a `/` shortcut, status chips and sort. Each card has an orb, status,
  language chips, STT/LLM/TTS "provider dots", activity, and Edit / Talk buttons.
  - Empty state: a 3-step onboarding list.
  - Error state: "Can't reach the platform" with a Try again link.
  - Skeleton: `agents/loading.tsx`.
- **Problems**:
  - Provider-override dots and a legend are shown by default. That is technical info in a primary
    surface.
  - The stats repeat what the list already shows.
  - The error path catches every error, including bugs, as "platform unavailable"
    (`agents/page.tsx:60`).
- **Preserve**: `buildAgentCards` logic (`lib/agent-view.ts`), keyboard search, and the clearable
  empty-search state.

### `/agents/new` and `/agents/[id]/edit` – Agent form (`components/agent-form.tsx`)

- **Purpose**: create or edit an agent.
- **UX**:
  - `TemplatePicker` (6 Platform templates) above a 3-section form: Basics, Languages and voice,
    Providers. A live preview card sits on the side.
  - Provider `<select>`s per layer. Providers the Runtime does not support are disabled (allow-list
    at `agent-form.tsx:27-31`).
  - `beforeunload` guard while there are unsaved edits.
- **Problems**:
  - No `mode`/`interpreter`/`translation` fields, so you **cannot create an interpreter agent from
    the UI**.
  - Languages are limited to EN/RU (`agent-form.tsx:16-19`), while the backend interpreter accepts
    14 (`backend…/validation.py:22-24`).
  - The free-text "Voice ID" field (`:194`) sits next to the "Voice" library picker, which is
    confusing.
  - The edit page loads on the client with a bare "Loading agent…" (`edit/page.tsx:27`).
- **Preserve** (tests and e2e query these): labels "Agent name", "Description", "System prompt",
  "Speech-to-text provider", "Language model provider", "Text-to-speech provider", checkbox
  "Russian", buttons "Create agent" / "Save changes". Also: provider ids are only sent when changed
  (`agent-form.tsx:126-130`).

### `/agents/[id]` – Agent detail (server component)

- **Purpose**: overview of one agent.
- **UX**:
  - Hero with orb, status, languages, "Talk to this agent" and "Edit agent".
  - Grid of panels: Configuration (raw provider ids or "Runtime default"), Recent conversations (5),
    Deployments, Tools, Knowledge, and a collapsible System prompt.
- **Problems**:
  - It shows raw UUIDs and `voice_id`, and puts provider config first.
  - Five "Coming soon" notes across the panels.
  - It fetches all conversations and filters on the client (`agents/[id]/page.tsx:16`), even though
    the API supports `?agent_id=` (`backend…/main.py:770-775`).
  - Any error becomes `notFound()` (`:80`).
- **Preserve**: link "Edit agent" and heading = agent name (e2e).

### `/agents/[id]/test` – Voice Playground (the only realtime screen)

- **Purpose**: talk to one AI agent and check that the pipeline works.
- **UX**:
  - Left: a dark "stage" card with `VoiceStage` (56 radial CSS bars, a core, ripples), a caption,
    a Start/End button and "Preview animation" (a simulated loop, badged).
  - Right: `PipelineCheck` (7 steps: Platform API, Voice runtime, Audio room, Microphone, STT, LLM,
    TTS), `LatencyPanel` (always "—" plus Coming soon), and a "Diagnostics" `<section>` of raw lines
    (`Connection: {phase}`, `Runtime handoff`, `Conversation activity`, `Microphone activity`,
    `AI speaking`, `Persisted conversation`).
  - Below the fold: "Live transcript" as plain `role · lang: text · Detected · time` lines.
- **Problems**:
  - Two of the three columns of content are developer diagnostics. People and conversation, the
    brief's first two priorities, are missing.
  - There is no participant list, mic mute, device picker or speaker control. Leave is the only
    control.
  - All remote speakers are labelled "agent" (`page.tsx:283`).
  - The transcript sits below the pipeline and diagnostics. On mobile it is far below the fold.
  - The status text is a developer message ("Platform session created · runtime accepted").
  - The stage card is hard-coded dark in both themes (`playground.css:9`).
  - One 450-line component holds all the logic, and `setLevels` re-renders the whole page on every
    `ActiveSpeakersChanged`.
- **Preserve (hard contracts, see §7)**: button names "Start conversation" / "End conversation" /
  "Retry end session"; the single `role="status"` text "Connected to LiveKit; microphone is on." and
  "Session ended and saved."; text lines "Conversation activity: …", "Runtime handoff: …",
  "Microphone activity: …", "AI speaking: …"; link "Open conversation history";
  `audio[data-voice-labs-audio]`; all mount/unmount race handling.

### `/conversations` – History list (client)

- **Purpose**: list past and active conversations.
- **UX**: polls every 5 s (`conversations/page.tsx:39`). Rows show orb, "Conversation {id8}", agent
  name, relative start, duration, outcome and channel badges, and raw status. There are outcome
  filter chips and a "Refresh now" button.
- **Problems**:
  - The row title is a truncated UUID.
  - There is no participant or language-pair info and no transcript preview.
  - The page fetches every conversation (no paging).
- **Preserve**: heading "Conversations"; the failed-request behaviour (not shown as empty), which a
  test covers.

### `/conversations/[id]` – Conversation detail (client)

- **Purpose**: transcript and lifecycle of one conversation.
- **UX**:
  - Details panel with raw `Conversation ID`, `Agent` id, status, `Voice session` status and times.
  - `OutcomePanel` (set outcome / summary / intent, shows handoff).
  - "Voice session activity" event log.
  - Chat-style transcript with `LanguageTags`, a script tint legend and a "Detected:" line.
  - Polls every 3 s while active.
- **Problems**:
  - It leads with IDs.
  - Original and translation are not paired.
  - The speaker is shown only as `role` (`user`/`assistant`).
- **Preserve**: the text structure relied on by tests (`Voice session: …`, event labels,
  `user · ru: …`), the 404 handling that stops polling, and stale-response guards.

### Secondary workspace pages

| Page | File | Purpose / state | Notes |
| --- | --- | --- | --- |
| `/voices` | `app/(dashboard)/voices/page.tsx` | Voice library with status and source chip filters, polled every 10 s | "Preview voice" is disabled behind `voicePreview`, but `POST /voices/{id}/preview` **exists** in the backend (`voices.py:257`), so the flag is stale. |
| `/voices/clone`, `/voices/design` | `components/features/voices/clone-form.tsx`, `design-form.tsx` | Consent-gated clone, prompt-based design | Good consent UX; keep it. |
| `/campaigns`, `/campaigns/new`, `/campaigns/[id]` | `app/(dashboard)/campaigns/*` | Outbound SIP lists, schedule, status transitions | Outbound call-centre feature. Outside the brief's core. |
| `/knowledge`, `/tools` | `app/(dashboard)/knowledge/page.tsx`, `tools/page.tsx` | Document and tool CRUD (enable/disable only) | Agent-builder features; secondary. |
| `/analytics` | `app/(dashboard)/analytics/page.tsx` | Totals, bars by outcome/channel/language, latency | The latency key mismatch means it is always "Coming soon" (§1.6). |
| `not-found` | `app/not-found.tsx` | 404 | Has its own dark tokens (`app/theme-shared.css:20-24`). |

---

## 3. Existing components by group

| Group | Components (file) | Gaps |
| --- | --- | --- |
| **Navigation** | `DashboardHeader` (`components/features/agents/dashboard-header.tsx`, 7 flat links), `CommandPalette` (`components/features/agents/command-palette.tsx`, native `<dialog>`, ⌘K), `MobileNavigation` (`components/features/landing/mobile-navigation.tsx`, marketing only), `.dash-back` links on every sub-page | No mobile nav for the workspace: the 7 links scroll sideways (`workspace.css:144-148`). No separation between communication, workspace and developer areas. No skip link in the workspace. |
| **Communication** | Only the playground page itself (`app/(dashboard)/agents/[id]/test/page.tsx`) | **No** Call/Room, Participant, Invite/Join, Lobby or pre-call (device check) components. |
| **Audio** | `VoiceStage` + `useStagePreview` (`components/features/playground/voice-stage.tsx`), `AgentOrb` (`agents/agent-orb.tsx`, decorative CSS bars), landing `AnimatedVoiceOrb` + `voice-input.ts` (AnalyserNode), voice `VoicePreview` (`components/features/voices/voice-preview.tsx`) | No mic meter driven by a real local level, no mute indicator, no device or output selector, no per-participant audio indicator. |
| **Translation** | None | No language-pair display, translation line, "translating" state or per-listener track indicator. |
| **Transcript** | Inline `<ol>` in the playground (`page.tsx:437-448`), chat list in conversation detail, `LanguageTags`, `ScriptText` | No reusable TranscriptLine, original↔translation pairing, speaker attribution, autoscroll or "jump to live". |
| **Settings** | `ThemeToggle` (`components/features/landing/theme/theme-toggle.tsx`) | No call settings, audio settings or user settings. |
| **Provider configuration** | Provider cards inside `AgentForm` (`components/agent-form.tsx:142-158`), provider dots in `AgentBrowser`, Configuration panel on agent detail | No provider management page (`POST /providers` is unused). No interpreter engine or latency-mode selector. |
| **Status indicators** | `PipelineCheck` (`playground/pipeline-check.tsx`), `LatencyPanel`, `Badge` (`workspace/ui.tsx:16`), `.agent-status` dot, `.convo-status`, `Soon`/`SoonNote` | No connection-quality or reconnecting banner component. Status is mostly text. |
| **Forms** | `AgentForm`, `TemplatePicker`, `CloneForm`, `DesignForm`, `VoiceFields`, `CampaignForm`, `DeploymentsPanel` inline form, `AssignmentPanel` checkboxes, `OutcomePanel` form, inline forms in tools/knowledge/campaign detail | Native controls with global styles. No shared Field/Input/Select component, and validation messages are per form. |
| **Modals** | `CommandPalette` only (native `<dialog>`) | No Dialog, confirm (`window.confirm` is used at `campaigns/[id]/page.tsx:28`), toast or tooltip (`title=` attributes only). |
| **Shared UI** | `PageHead`, `Badge`, `Soon`, `SoonNote`, `Notice`, `Empty`, `formatDate` (`components/features/workspace/ui.tsx`), skeleton CSS for agents only | No Button, Avatar, Tooltip, Toast, Loading or ErrorState components. Most loading states are a bare `<p role="status">Loading…</p>`. |
| **Decorative** | `NetworkBackground` / `DashboardBackground` / `HeroNetwork` (`components/features/network/network-background.tsx`, 387-line canvas), `AmbientBackground`, `SectionAmbience` | Runs on every workspace page, including during a live call (see §5). |

---

## 4. Styling system

**CSS files (all global, imported by layouts or pages):**

| File | Lines | Scope |
| --- | --- | --- |
| `app/globals.css` | 326 | Tokens (`:root`), base elements, buttons, inputs, landing hero and orb |
| `app/theme-shared.css` | 24 | Theme toggle, view-transition reveal, 404 dark tokens |
| `app/(marketing)/motion.css` | 383 | Landing motion, `--ease-expo` |
| `app/(marketing)/theme-dark.css` | 115 | Marketing dark, scoped to `.marketing-root` |
| `app/(dashboard)/dashboard.css` | 340 | Workspace shell, agents, palette, conversations, agent form, `--ease-expo` (again) |
| `app/(dashboard)/dashboard-dark.css` | 134 | Workspace dark: token flips plus about 100 hard-coded overrides |
| `app/(dashboard)/workspace.css` | 156 | Voices/campaigns/tools/knowledge/analytics |
| `app/(dashboard)/agents/[id]/test/playground.css` | 110 | Stage, pipeline, diagnostics, transcript |
| `app/not-found.css` | 17 | 404 |

**Tokens** (`app/globals.css:1-56`):

- **Colour**: `--ink #1d2022`, `--muted`, `--line`, `--paper #f6f5ef`, `--surface #fffefa`,
  `--accent #ff624c` (coral) and its variants, `--signal #d9f455` (lime), `--focus #283ee8`,
  `--band*`.
- **Radii**: 3/4/5/6 px.
- **Shadow**: one token.
- **Motion**: `--motion-fast 180ms`, `--motion-standard 240ms`, `--ease-standard`.
- **Type scale**: `--text-display` … `--text-label 11px`.
- **Spacing**: partial set: `--space-4/5/6/7/8/12`, `--section-*`.

**Token bugs:**

- `--ink-3: var(--ink-3)`, `--line-strong: var(--line-strong)` and `--band-ink-2: var(--band-ink-2)`
  (`globals.css:25,28,30`) refer to themselves. They are invalid at computed-value time in light
  theme. `--line-strong` only gets a value in the dark override (`dashboard-dark.css:20`).
- Many colours are hard-coded rather than tokenised, for example `#85877f` and `#cfcfc7` in
  `playground.css` and `dashboard.css`, and each needs a dark override.
- `dashboard-dark.css` exists largely to patch those hard-coded values.

**Themes**:

- Light and dark come from `html[data-vl-theme]`, set before paint by `themeInitScript`
  (`components/features/landing/theme/theme.ts:36`) and persisted in `localStorage`.
- Dark rules are scoped per area (`.marketing-root`, `.dash-root`).
- The default follows `prefers-color-scheme`.

**Fonts** (`app/layout.tsx:7-9`, `next/font/google`, self-hosted):

- Manrope (display, Latin + Cyrillic), DM Sans (body, **Latin only**), DM Mono (labels).
- The `--serif` stack is system fonts.
- **None of these faces includes Hangul/CJK glyphs.** Korean text would fall back to system fonts.

**Animation libraries and where they are used:**

| Library | Used in | Purpose |
| --- | --- | --- |
| `gsap` (+ ScrollTrigger, SplitText) | `components/features/landing/motion/gsap.ts`, `landing-motion.tsx`, `workspace-showcase.tsx`, `voice-preview.tsx`, `code-switch.tsx` | Landing entrance timelines, pinning, scrub, split text, counters |
| `animejs` v4 | `components/features/landing/animated-voice-orb.tsx` only | Hero orb entrance and bars |
| `lenis` | `components/features/landing/motion/landing-motion.tsx:48`, `scroll-controller.ts` | Landing smooth scroll |
| CSS keyframes | `playground.css` (stage bars, ripples, spin), `dashboard.css` (card-in, orb bars, count-up), `motion.css` | All workspace motion |
| Canvas 2D (no library) | `network-background.tsx` | Dashboard and hero background |

None of the three JS libraries is imported anywhere under `app/(dashboard)`. The workspace and
playground use CSS only.

**Reduced motion**:

- Handled in `globals.css:307`, `dashboard.css:234`, `playground.css:108-110` (bars, ripples and
  wave stop; the spinning `stage-arc` and the `pipe-list` spinner are **not** covered), the canvas
  (still frame), and GSAP/anime scopes.
- The theme circular reveal: the reduced-motion check was not verified in `theme-toggle.tsx`.

---

## 5. UX problems

**Confusing flows**

- The only way into a live call is Agents → agent card → "Talk" → playground → "Start
  conversation". There is no "start a call" or "join a call" entry point, and no concept of
  inviting a second person.
- The word "Agent" stands for every product concept, including a would-be interpreter.
- Pre-call: microphone permission is requested, then the stream is thrown away (`page.tsx:225`).
  There is no device check or mic test before joining.

**Unnecessary or technical info at the top level**

- Playground: the 7-step pipeline, latency, and diagnostics with raw phase names (`Connection:
  starting`), "Runtime handoff: accepted", and "Persisted conversation".
- Raw UUIDs: conversation rows ("Conversation 3f2a91b0"), conversation detail ("Conversation ID",
  "Agent: <uuid>"), agent detail (STT/LLM/TTS ids, "Voice ID").
- Provider dots and their legend on every agent card.
- About 12 "Coming soon" notes across pages. Several are stale: voice preview exists in the backend,
  and the Runtime emits latency events.

**Poor hierarchy**

- Playground: the stage visual is the hero, but it shows a brand mark ("v.") rather than people.
  The transcript, which is what people said, is below the fold.
- Agent detail: six equal-weight panels.

**Repeated UI**

- Language lists in three places.
- `json()` helper copied in 5 lib modules.
- `--ease-expo` defined twice.
- The `.dash-head` block is hand-written on pages that could use `PageHead`.
- Three polling implementations.

**Weak empty, loading and error states**

- Most loading states are a bare `<p role="status">Loading…</p>`. Only `/agents` has a skeleton.
- Errors often show raw messages (`conversations/page.tsx:31`, `edit/page.tsx:18`).
- The agent detail page turns any error into 404.
- The playground's "LiveKit is not configured…" message is shown to end users.

**Poor realtime state visualisation**

- States the brief needs that do not exist: *translating*, *speaking translation*, *muted*,
  *network degraded*, *other person speaking* (as distinct from the agent), *participant joined/left*.
- "Thinking" comes from polled Platform data, so it arrives 0–1.5 s late or more.
- The speaking level only updates on `ActiveSpeakersChanged`. There is no continuous meter.
- The canvas background animates during a live call: `idle` mode still runs `requestAnimationFrame`
  breathing on desktop (`network-background.tsx:265`, `modeForPath` at `:18`). That is constant
  motion that does not reflect system state.

**Accessibility**

- Good:
  - Global `:focus-visible` outline (`globals.css:62`).
  - Native `<dialog>` palette with combobox/listbox roles.
  - `aria-pressed` chips, `aria-current` nav.
  - sr-only state text in `PipelineCheck`.
  - Labelled form controls.
  - Marketing skip link.
- Issues:
  - The workspace has no skip link.
  - Playground diagnostics has four `aria-live="polite"` lines (`page.tsx:426-428`) that flip as
    often as LiveKit speaker events arrive, so screen readers will chatter.
  - Two `role="status"` elements can appear at once (`page.tsx:424`, `:436`), against the
    "exactly one" rule in `docs/workspace-ui.md`.
  - `VoiceStage` is `aria-hidden` and its caption is not live, so state reaches screen-reader users
    only through the noisy diagnostics.
  - The palette input and some inputs remove the outline in favour of a coral box-shadow
    (`dashboard.css:59,189,300`).
  - Tooltips are `title=` attributes only.
  - State colours (coral, lime, green) have not been checked for contrast. For example, lime
    `#d9f455` text on dark is used for "agent speaking" (`playground.css:53`).

**Responsive**

- Workspace header below 720 px: the brand text is hidden and 7 links scroll sideways inside the
  header. There is no menu.
- Playground below 960 px is one column: stage, then 3 diagnostic panels, then transcript. Call
  controls are not sticky. There is no mobile call layout.
- The agent form preview column (`form-layout` 340 px) needs a narrow-screen check.
  `dashboard.css:330-340` handles it; it was not checked visually.
- No viewport or screenshot verification was done in this audit, which was code-only.

---

## 6. Gap analysis against the brief

Target: two people (A speaks Korean, B speaks English). Each hears only a translation in their own
language, with realtime transcripts and visible state.

### 6.1 What the backend already supports and the frontend does not use

From `backend.voice-labs` at its current working tree:

| Capability | Backend evidence | Frontend status |
| --- | --- | --- |
| Interpreter agents (`mode: "interpreter"`, 2 languages, `direction`, `engine` cascaded/realtime, `latency_mode` instant/balanced/accurate, `hear_original`, `glossary`) | `platform/src/platform/main.py:102-157`, `:274-301` | Not in the `Agent` type, the form or the views |
| Interpreter languages: en, ru, **ko**, ja, zh, es, fr, de, it, pt, nl, hi, tr, pl | `platform/src/platform/validation.py:22-24` | UI offers en/ru only |
| Creator joins with a declared language, optional voice and display name: `POST /voice/sessions {agent_id, participant:{language, voice_profile_id?, display_name?}}` | `main.py:365-382`, `:613-617`, `:690-691` | Sends `{agent_id}` only (`lib/platform.ts:114-120`) |
| Add the second person: `POST /voice/sessions/{id}/participants`, which returns the guest's LiveKit `{url, token}`, `participant_identity` and a guest `session_token`. Max 2 people; languages must differ. | `main.py:548`, `:811-882` | Not called |
| Per-listener audio routing: the Runtime publishes `translation-for-<identity>` per listener, restricts subscription per listener, and unsubscribes people from each other's original mic unless `hear_original` | `runtime/src/runtime/audio_routing.py:1-36`, `participants.py:42-45` | Works with the current naive "attach every subscribed audio track" code, because the server only lets each browser subscribe to its own track. Nothing in the UI shows it. |
| LiveKit identities: creator `browser-<session_id>`, guest `guest-<hex8>`, Runtime `voice-labs-agent-<room>` with `kind: "agent"` | `main.py:655`, `:851`; `runtime/src/runtime/pipeline.py:170-174` | The UI treats every remote speaker as "the agent" (`page.tsx:283`). Telling the other human from the AI needs `participant.kind`/identity checks. |
| Speaker-attributed transcript events (`user_id`, `speaker_name`, `source_language`, `target_language`, `speaker_user_id`) | `runtime/src/runtime/interpreter.py:730-750`, `:862-876` | **Not exposed by the Platform** (see 6.2) |
| Session-scoped tokens for creator and guest | `platform/src/platform/auth.py:44-71` | Token dropped. No `Authorization` header. |
| Voice preview audio `POST /voices/{id}/preview` → `audio/wav` | `platform/src/platform/voices.py:257-299` | Implemented in `lib/voices.ts:53` but gated off |
| `LatencyMeasured` events (stt/llm/tts ttfb, translation, turn-to-first-audio) and analytics | `runtime/src/runtime/interpreter.py:851`, `platform/src/platform/analytics.py:18-140` | Key names do not match (§1.6) |
| Agent and translator mode (`translation: {working_language, caller_languages}`): an AI agent serving callers in other languages | `main.py:213-270` | Not exposed |

### 6.2 What the brief needs that the Platform API does **not** provide

The redesign must not invent these. Each needs backend work or must be left out or marked as such.

1. **Invite/join by link.** There is no "join session" endpoint. A guest's LiveKit token comes from
   the creator calling `POST …/participants`, which is `creator_only` (`auth.py:60-62`). A
   shareable link would have to carry the guest LiveKit token and session token inside the URL or
   fragment, or the backend needs an invite-code endpoint. LiveKit tokens have a **10-minute TTL**
   (`platform/src/platform/livekit.py:28`), so a link would expire quickly. There is also no lobby
   or "waiting for the other person" state on the server.
2. **Speaker identity and translation pairing in stored transcripts.**
   - `GET /conversations/{id}/messages` returns only
     `id, role, content, primary_language, detected_languages, created_at`
     (`main.py:1129-1150`). The `Message` model has no speaker columns
     (`platform/src/platform/models.py:108-123`). `speaker_name`, `speaker_user_id` and
     `source_language`/`target_language` are dropped at ingestion (`main.py:1276-1288`).
   - `GET …/runtime-state` filters `TranscriptFinal` out (`main.py:1088-1104`).
   - What *can* be derived without backend changes: in a 2-person interpreter call the two
     participants' languages must differ (`main.py:845-847`). So `role:"user"` +
     `primary_language` identifies the speaker, and `role:"assistant"` + `primary_language`
     identifies the translation's listener. Pairing an original with its translation can only
     use ordering. That is a heuristic and should be labelled as one.
3. **Realtime (push) transcripts or partials.** There is no WebSocket/SSE, the Runtime has no
   LiveKit data/text stream (no `publish_data` / text-stream calls in `runtime/src/runtime/*.py`),
   and there is no interim transcript event type (`events.py:10-26`). "Transcript streaming"
   therefore means 1.5 s polling of finalized utterances.
4. **"Translating" / "speaking translation" state.**
   - No runtime event marks translation start or end.
   - `AgentSpeechStarted` / `TurnCompleted` exist, but in interpreter mode it was not verified
     whether they are emitted per listener.
   - Client-side signals that *are* available: the Runtime participant (`kind: agent`) becoming an
     active speaker, and the time between a remote human's speech ending and the Runtime speaking.
     These are approximations.
5. **Per-participant state for the remote person.** Speaking (via LiveKit active speakers), mute
   (`TrackMuted`) and connection quality (`ConnectionQualityChanged`) are all available from
   `livekit-client` on the client and need no backend. Nothing on the server records each person's
   language for the UI, apart from the contract held inside the Runtime.
6. **Changing language or translation mode during a call.** There is no endpoint to change a
   participant's language or the interpreter settings during a call. `POST …/participants` only
   adds. The agent's `interpreter` is fixed at session creation (`main.py:676-678`).
7. **Browser ↔ phone, AI participant joining a human call, provider switching during a call.**
   - SIP campaigns and deployments are stored. Dialing is gated (`sipDialing`).
   - An AI agent joining a human-to-human call is not modelled: interpreter and agent modes are
     mutually exclusive (`main.py:231-234`).
   - Providers are fixed per agent at session creation.
8. **Auth and identity of humans.** There are no user accounts. API keys are for admins only.
   "Who is in the conversation" can only show `display_name` (given at join) or the LiveKit
   identity.
9. **Session lifecycle for two people.** `POST …/end` ends the whole session for both people
   (`main.py:979-1012`). There is no "leave without ending". The playground also calls `end` when
   LiveKit drops unexpectedly (`page.tsx:309-323`). In a two-person call that would end the call
   for the other person too, so the redesign must change this.

### 6.3 Effect on redesign scope

- The core communication screen **can be built on today's backend** for the cascaded interpreter
  with two browser participants:
  - an agent with `mode:"interpreter"`;
  - the creator joins with `participant.language`;
  - the creator gets a guest connection from `POST …/participants` and passes it to B out-of-band
    (copy link containing the token, valid 10 min);
  - both attach their single subscribed translation track;
  - state comes from LiveKit participants, active speakers, mute and quality;
  - the transcript comes from polled messages, attributed by language.
- This needs frontend API additions: `mode`/`interpreter` on `Agent`, `participant` on
  `createVoiceSession`, a new `addSessionParticipant`, and storing `session_token`. These are within
  the "calling Platform and joining LiveKit" boundary in AGENTS.md.
- Features that must be shown as unavailable, or need backend work: real invite links or lobby,
  live/partial transcripts, original↔translation pairing, an explicit "translating" event, changing
  language mid-call, leave-without-end, AI joining a human call, and phone participants.
- The existing human ↔ AI playground must keep working (tests and e2e depend on it). It should
  become a secondary or developer surface.

---

## 7. Test status and functionality that must not break

**Results (run 2026-10-21 in this repo, existing `node_modules`):**

- `npm test` (Vitest 5.0.4): **19 files, 87 tests, all passed**, 2.24 s. jsdom logs
  "HTMLCanvasElement getContext() not implemented" 5 times. This is expected: the canvas code
  tolerates a missing 2D context, and a test asserts that.
- `npm run typecheck` (`tsc --noEmit`): **passed, no errors.**
- `npm run build` (Next 16.3.8, Turbopack): **passed**; 17 static pages generated (route table in
  §1.2).
- `npm run test:e2e`: **not run.** It needs the sibling backend services via `uv`, a LiveKit server
  at `ws://localhost:7880`, and Playwright Chromium.

**Unit tests (`__tests__/`):** platform client, agent form/browser/view, command palette, dashboard
header, conversations list/detail, script text, workspace features (voices, campaigns, outcomes,
tools, knowledge), playground pipeline/stage, voice playground (15 tests on the LiveKit lifecycle
and its races), landing structure/sections/preview, code switch, network background, theme toggle,
voice input.

**Contracts that a redesign must keep, or must update together with its tests:**

1. **Playground** (`__tests__/voice-playground.test.tsx`, `e2e/voice-session.spec.ts`):
   - Accessible button names "Start conversation", "End conversation", "Retry end session".
   - Exactly one `getByRole("status")` containing "Connected to LiveKit; microphone is on." and
     later "Connection: ended · Session ended and saved." (the test checks `toContain` on the
     status text).
   - Text lines "Runtime handoff: starting|active", "Microphone activity: Speech detected|No speech
     detected", "AI speaking: Yes|No", "Conversation activity: <label>" for each of the 5 mapped
     events.
   - Link "Open conversation history".
   - A `role="alert"` for blocked playback.
   - `audio[data-voice-labs-audio]` elements actually playing (e2e).
   - Transcript text visible on the page (e2e: "synthetic ingress transcript").
2. **LiveKit lifecycle invariants** (tests at `voice-playground.test.tsx:98-466`):
   - The probe happens before session creation.
   - Mic errors produce no session.
   - Unmounting during create, connect, end or failed start never double-disconnects or
     double-ends.
   - A late session after unmount is ended.
   - An unexpected disconnect ends the session (this needs rethinking for 2-person calls, §6.2-9).
3. **The `PipelineCheck` "proven only by real results" rule and "no transcript text inside the
   pipeline"** (`__tests__/playground-pipeline.test.tsx`; uniqueness is relied on by e2e).
4. **Agent form labels and button names** (`e2e/agent-management.spec.ts`,
   `__tests__/agent-form.test.tsx`). Also: provider ids are only sent when changed, and providers
   the Runtime does not support stay disabled.
5. **Conversation detail**: stale-response guard, 404 stops polling, "Transcript unavailable"
   rather than empty, label text for events and `Voice session: …`.
6. **Landing**: one h1, valid anchors, sequenced sections.
7. **Theme**: `data-vl-theme` set before paint and persisted under `vl-theme`.
8. **Platform client**: `request()` keeps the HTTP status on errors and parses FastAPI validation
   lists.

---

## 8. Dependency notes

| Dependency | Needed? | Evidence / note |
| --- | --- | --- |
| `livekit-client` | **Yes**, core | Only `page.tsx:5`. Pinned to `latest`, which risks silent major upgrades; consider pinning to `^2.22`. |
| `next`, `react`, `react-dom` | Yes | `react*` and `@types/*` and `typescript` are also `latest`. |
| `gsap` (+ ScrollTrigger, SplitText) | Landing only | Pinning and scrub in `workspace-showcase.tsx` and split text in `landing-motion.tsx`. Zero use in the workspace or call UI. 6.3 MB in `node_modules`; tree-shaken in the bundle, which was not measured. |
| `animejs` | Landing only, **one component** | `animated-voice-orb.tsx` entrance and bars. Overlaps with GSAP; could be replaced by GSAP or CSS to drop a library. Two motion engines on one page. |
| `lenis` | Landing only | Smooth scroll in `landing-motion.tsx:48`. Not needed for the product; it fights native scrolling and reduced-motion expectations. Already disabled under reduced motion. |
| `@opennextjs/cloudflare`, `wrangler` | Deploy | `next.config.ts` calls `initOpenNextCloudflareForDev()`. |
| Test deps | Yes | Vitest, Testing Library, jsdom, Playwright. |

For the communication UI, nothing new is required. A waveform or level meter can come from
`livekit-client` (`participant.audioLevel`, or a `Track.mediaStreamTrack` with an `AnalyserNode`,
which `voice-input.ts` already wraps) with CSS or canvas.

---

## 9. Files inspected

**Fully read:**

- `lib/*.ts` (all 17)
- `app/(dashboard)/**/page.tsx` (all), `app/(dashboard)/layout.tsx`, `app/layout.tsx`,
  `app/(marketing)/layout.tsx`
- `components/agent-form.tsx`
- `components/features/agents/*`, `components/features/conversations/*`,
  `components/features/playground/*`, `components/features/workspace/ui.tsx`,
  `components/features/voices/voice-preview.tsx`
- `components/features/landing/landing-page.tsx`, `voice-input.ts`, `motion/gsap.ts`,
  `motion/scroll-controller.ts`, `theme/theme.ts`
- `playground.css`, `theme-shared.css`
- `docs/workspace-ui.md`, `docs/workspace-features.md`, `docs/design-resource-audit.md`
- `e2e/voice-session.spec.ts` (first 120 lines), `playwright.config.ts`

**Partially read (grep or excerpt):**

- `globals.css`, `dashboard.css`, `dashboard-dark.css`, `workspace.css`
- `network-background.tsx`, `animated-voice-orb.tsx`, `landing-motion.tsx`, `clone-form.tsx`
- test files (names and selectors only), `.agents/skills/*` (headers)

**Not read:**

- `motion.css`, `theme-dark.css`
- `code-switch.tsx`, `comparison.tsx`, `workspace-showcase.tsx`, `screenshot-gallery.tsx`,
  `mobile-navigation.tsx`, `theme-toggle.tsx`
- `design-form.tsx`, `voice-fields.tsx`, `campaign-form.tsx`
- `docs/landing-*.md`, `Dockerfile`, `compose*`, `wrangler.jsonc`

**Backend (read only):**

- `platform/src/platform/main.py` (`:95-905`, `:979-1300`), `auth.py`, `livekit.py`,
  `validation.py:20-36`, `voices.py:257-300`, `models.py:108-123`, `analytics.py` (grep)
- `runtime/src/runtime/audio_routing.py:1-60`, `participants.py:30-60`, `events.py`,
  `interpreter.py` (excerpts), `pipeline.py:160-185`
