# Performance review: call screens (/call, /join)

Agent 5c, Performance Benchmarker. Review only: no code was changed.

## Method and environment

- `npm run build` (Next 16.3.8, Turbopack) on the working tree. It passed. `next-env.d.ts` was not modified.
- **Bundle sizes.** Turbopack does not print first-load sizes, so they come from the prerendered HTML. For
  each route I collected every `<script>`/`<link>` chunk and measured it raw and gzip -9.
- **Baseline.** HEAD (`08c6a47`) was built the same way from a `git archive` copy in `/tmp`, which has since been deleted.
- **Runtime.** Playwright with chrome-headless-shell 1243 and the CDP `Performance` domain. I measured a
  10 s steady-state window after load, plus `PerformanceObserver` for long tasks and layout shifts and a
  MutationObserver.
  - A React commit probe (a stub `__REACT_DEVTOOLS_GLOBAL_HOOK__`) counts the components whose props
    object changed in each commit.
  - Production server (`next start`) for `/`, `/call`, `/join`, `/conversations` and `/agents/new`. Dev server for
    `/call/fixture?state=live|translating|reconnecting`.
- **Micro-benchmarks.** One drives a bound level meter at 20 Hz for 5 s. One times `pairCallMessages` and
  `JSON.parse` at 50 to 2,000 messages (Node 24).
- **Caveats.** Unthrottled Apple Silicon on localhost, no CPU or network throttling, and no real LiveKit room.
  The absolute milliseconds are therefore best case. Use the counts (renders, recalcs, bytes) for comparison.
  Re-run under 4x CPU throttle on a mid-range Android before release.

## Key numbers

### First-load (gzip)

| Route | JS | CSS | Notes |
| --- | --- | --- | --- |
| `/call` | **336.9 KB** (11 files) | 40.9 KB | `livekit-client` chunk alone is 136.4 KB |
| `/join` | **333.0 KB** (12 files) | 40.9 KB | same LiveKit chunk |
| `/` (landing) | 231.6 KB (HEAD 251.6) | **43.3 KB (HEAD 15.6)** | gsap stays here |
| `/conversations` | 186.4 KB (HEAD 185.5) | **44.9 KB (HEAD 17.3)** | |
| `/agents/new` | 191.0 KB (HEAD 189.2) | **44.9 KB (HEAD 17.3)** | |

- **Framework baseline.** All routes share 168.9 KB gz of JS. On top of that, `/call` adds 168 KB of
  route-specific JS, `/join` adds 164 KB, and `/conversations` adds 17.6 KB.
- **Animation libraries.** gsap, anime.js and lenis have 0 occurrences in any `/call` or `/join` chunk (grep
  for `GreenSock|gsap.|lenis|animejs|createTimeline`). The landing chunk `2v8h36x4jaf3p.js` has 58.
- **call.css.** 30.9 KB raw, **6.0 KB gz**, against a budget of 12 KB. It ships only on the `(call)` routes.

### Runtime (steady state, 10 s window)

| Screen | React commits | Components re-rendered | Layouts | Style recalcs | Script | Long tasks | CLS | Infinite animations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fixture `live` (dev) | **10** (1/s) | ConnectionIndicator, StatusLine, Transcript, CallControls, 3× CallDialog, 7× Icon per tick | 10 | 49 | 91 ms (dev) | 0 | 0 | 1: binary breath (5 bar animations, opacity) |
| fixture `translating` | 10 | same | 10 | 44 | 82 ms | 0 | 0 | 1: bridge packet (transform) |
| fixture `reconnecting` | 13 | same | 10 | 50 | 88 ms | 0 | 0 | 2: spinners (rotate) |
| `/call` setup (prod) | – | – | 0 | 0 | 0 ms | 0 | 0 | 0 |
| `/join` (prod, no invite) | – | – | 0 | 0 | 0 ms | 0 | 0 | 0 |
| `/conversations` (prod, for context) | – | – | 0 | 0 | 230 ms | 0 | 0.0002 | canvas background |
| `/` landing (prod, for context) | – | – | 0 | 600 | 12 ms | 0 | 0 | 7 |

- **What stayed stable.** `ParticipantCard`, `InterpreterBridge` and `TranscriptTurn` did **not** re-render
  on the timer tick, so their `memo` holds.
- **The 1 s ticks.** The single commit per second is the `useElapsed` timer. The 10 layouts per window are
  the timer text changing.
- **Level meter, driven at 20 Hz for 5 s (100 `--level` writes):**
  - 0 React renders.
  - 5 layouts, all from the timer, so the meter caused none.
  - 279 style recalcs, about 1 ms total per write in dev headless.
  - The bars run as 5 concurrent `CSSTransition:transform` (compositor-eligible).
- **Font transfer (prod, cold cache):**

  | Route | Fonts | Noto Sans KR slices |
  | --- | --- | --- |
  | `/join` and dashboard | 93 KB | 0 |
  | `/call` setup (English UI) | **155 KB** | 4 (≈62 KB) |
  | Fixture with Korean transcript | 186 KB | 6 |
  | Landing | 187 KB | 6 |

### Transcript cost by message count (Node 24, per poll)

| Messages | Payload (raw JSON) | `JSON.parse` | `pairCallMessages` |
| --- | --- | --- | --- |
| 50 | 10.5 KB | 0.01 ms | 0.01 ms |
| 200 | 42 KB | 0.05 ms | 0.04 ms |
| 600 (about a 30-minute call) | **126 KB** | 0.15 ms | 0.11 ms |
| 2,000 | 422 KB | 0.49 ms | 0.36 ms |

CPU is not the problem here. The bytes are: see finding 3.

## What is already right (verified)

- **Levels never go through React.**
  - `LevelStore.set` writes `--level` on bound elements through refs. EPSILON (0.02) skips near-identical
    writes, and reduced motion buckets the level into 3 steps written at most every 500 ms.
  - Measured: 0 renders per sample.
- **The throttles are real.**
  - `createLevelSampler` reads the analyser at most every 50 ms (20 Hz).
  - It stops itself after `tailMs` of silence (600 ms local, 900 ms translation).
  - It starts only on `ActiveSpeakersChanged`, when that seat is in the speaker list.
  - In a silent call no sampler loop runs. Remote levels need no loop, and the other person's meter is
    binary (CSS only).
- **The reducer bails out on no-ops.**
  - `speakers` compares the three booleans and returns the same `state`.
  - `quality`, `muted`, `sound-blocked`, `hearing`, `reconnecting` and `interpreter-unavailable` also
    return `state` unchanged.
  - So `ActiveSpeakersChanged` at the server rate (2–3 Hz) and `ConnectionQualityChanged` re-render only
    on a real change.
  - `hearing` flips to `true` at a level over 0.04, but back to `false` only when the level is exactly 0
    (the stop). So it cannot oscillate at 20 Hz.
- **The poll loop cannot overlap.**
  - It is a `setTimeout` chain scheduled *after* both requests settle, guarded by `alive`.
  - The timer is cleared on cleanup.
  - Its effect depends only on `conversationId`, `sessionId`, `token` and `active`, so phase changes
    between connecting, live and reconnecting do not restart it.
  - It stops on `ended`/`failed`/404 and when `active` goes false.
  - Unchanged polls keep the same array (`sameIds`), so nothing renders.
- **All timers are cleaned up**: grace timer, translating timeout, 5 s pending re-check, elapsed timer,
  invite countdowns, `beforeunload`, wake lock and keydown.
- **Unmount** disconnects the room, removes the `<audio>` elements, disposes both samplers and closes the
  `AudioContext`.
- **The `isCurrent()` guard** stops a stale `Room`'s events from dispatching after a rejoin.
- **The CSS animates only transform and opacity.**
  - Meters use `scaleY` with a 120 ms linear transition.
  - The packet uses `translateX`, the spinners `rotate`, and rows, banners and dialogs use opacity plus
    translate.
  - Paint-only transitions (`background`, `border-color`) fire only on state changes.
  - The infinite animations stay within the budget of 2 or fewer:
    - The bridge packet ends when `translating` times out (6 s).
    - The breath runs only while the other person is speaking.
    - The spinners run only while reconnecting.
- **No canvas on `/call` or `/join`.** Idle script time on prod `/call` was 0 ms per 10 s. Compare 230 ms per
  10 s on dashboard routes, where the canvas background still runs.
- **CLS 0 and no long tasks in steady state.** The only long task was one 51 ms task on the first dev load of
  the fixture (dev compile and hydration).

## Findings, ranked by impact

### 1. HIGH (every route): Noto Sans KR adds 26 KB gz of render-blocking CSS everywhere

- `app/layout.tsx` loads `Noto_Sans_KR({ preload: false })` in the **root** layout.
- `preload: false` does stop the woff2 preload, but next/font still writes **all 124 unicode-range
  `@font-face` rules** into the root stylesheet `1ni_cttsu9jyd.css`.
- That is **77.7 KB raw / 26.0 KB gz** of declarations, out of the file's 111 KB raw / 35 KB gz. The same file
  carries only 7.7 KB gz of real CSS.

Effect:

- Render-blocking CSS on routes that never show Hangul went up 2.6×:
  - Dashboard: 17.3 → 44.9 KB gz.
  - Landing: 15.6 → 43.3 KB gz.
- On slow 3G, about 27 KB extra on the critical path is roughly 150–250 ms of FCP/LCP.
- The CSSOM is bigger on every page.

Secondary effects:

- **An English-only `/call` setup still downloads 4 Noto slices (≈62 KB).** This happens because:
  - DM Sans and Manrope do not cover `↔` (U+2194), which is in the call title and the More sheet. It falls
    through to Noto KR slice #100.
  - The language picker renders native names `日本語`, `中文` and `한국어`.
- **Japanese and Chinese text renders in Noto Sans KR's Korean glyph forms** (Han unification), because
  `--font-hangul` comes *before* Hiragino and PingFang in `--sans`/`--display`. This is a typographic
  correctness problem for the `ja` and `zh` interpreter languages, and it also costs downloads.

Fixes, cheapest first:

- **a.** Drop the web font and put system Hangul faces in the stacks:
  `"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", "Noto Sans KR"`. Every target OS ships
  one. Cost: 0 bytes.
- **b.** If the brand face is required, move `Noto_Sans_KR` from the root layout into
  `app/(call)/layout.tsx`, plus the landing if its hero needs it. The dashboard then carries 0 bytes.
- **c.** Add `:lang(ja) { font-family: var(--font-display), "Hiragino Sans", … }` and the same for `:lang(zh)`.
  The text nodes already carry `lang`, so CJK ideographs skip Noto KR.
- **d.** Draw `↔` as the existing `Icon` (SVG) rather than a glyph.
- **Target:** root CSS back to about 9 KB gz, and 0 Noto requests on English-only screens.

### 2. HIGH (`/call`, `/join`): LiveKit is in first-load JS before anyone presses Start or Join

- `use-call-room.ts` imports `Room`, `RoomEvent` and `Track` statically from `livekit-client`.
- This puts a **136.4 KB gz** chunk (`16n0-ysnnmsj8.js`) on the setup and lobby screens. That is 40 % of
  `/call`'s 337 KB.
- `/call` is **+79 %** over a dashboard route (188 KB). On a mid-range phone that is roughly 0.5–1 s of extra
  parse and compile before the setup form is interactive. This is the guest's first impression.

Fix:

- Keep `import type { … }` for the types.
- Inside `connect()`, load the module with `const { Room, RoomEvent, Track } = await import("livekit-client")`
  (the enums are needed at runtime only there).
- Warm it once the form is visible, with `requestIdleCallback(() => import("livekit-client"))` or on mic
  check success. That way Join does not wait for the download.
- The existing `vi.mock("livekit-client")` still works with dynamic import.
- **Expected:** `/call` and `/join` first-load at about 200 KB gz.

### 3. MEDIUM (grows with call length): every poll refetches the whole transcript

- `useCallConversation` sends `GET /conversations/:id` + `GET /conversations/:id/messages` every 1.5 s.
- The messages endpoint returns the **full list** each time. Measured raw payload:
  - 10.5 KB at 50 messages.
  - **126 KB at 600 messages** (about a 30-minute call).
  - 422 KB at 2,000.
- At 1.5 s that is up to about 84 KB/s raw, or about 20–40 KB/s after gzip for real text.
- Over a 30-minute call that adds up to tens of MB downloaded. It costs battery and cellular data on phones,
  and it competes with the WebRTC audio for bandwidth.
- Parsing and pairing cost only 0.26 ms per poll at 600 messages, so this is a **network** finding.

Related:

- **The tab keeps polling while hidden.** It does not pause, and the backoff is fixed at 1.5 s.
- **No request timeout or `AbortController`.**
  - `request()` in `lib/platform.ts` is a bare `fetch`.
  - A hung request silently freezes the chain. There is no overlap, but transcript and end detection stall.
  - On unmount the in-flight request is not aborted. Its result is dropped, but the bytes still download.

Fixes:

- **Backend.** Add `?after=<last message id|created_at>` (or ETag / `If-None-Match` → 304) and merge on
  the client.
- **Frontend now:**
  - Abort with an `AbortController` per tick (and on cleanup), with a 5 s timeout.
  - Poll at 1.5 s while visible and at 5 s or more while `document.hidden`.
  - After N unchanged polls, back off to 3 s while nobody is speaking: `state.self.speaking ||
    state.other.speaking || state.translating` is already known.

### 4. MEDIUM: `pairCallMessages` rebuilds every turn object, which defeats `memo(TranscriptTurn)`

- `useLiveCall` re-runs `pairCallMessages` when `messages` changes. It also re-runs every **5 s while any
  turn is pending** (`now` tick).
- Each run creates **new `CallTurn` objects for every message**, so `TranscriptTurn`'s shallow `memo`
  compare fails for all rows.
- Result: every new message, and every 5 s pending tick, re-renders **all visible rows (up to 50, or all of
  them after "Show earlier")**. The `[turns]` effect then calls `scrollToEnd`, which reads `scrollHeight`
  and forces a synchronous layout.
- The `announcements` memo also maps all `n` turns each time.

Fix:

- Keep a `Map<id, CallTurn>` cache in a ref.
- Reuse the previous object when `original?.id`, `translation?.id` and `status` are unchanged, so unchanged
  rows keep identity.
- Alternatively give `TranscriptTurn` a custom comparator on those three fields plus `people`.
- Run the 5 s `now` tick only for turns younger than `PENDING_TIMEOUT_MS`.
- Read `scrollHeight` only when the last turn's identity changed.

### 5. MEDIUM-LOW: a 1 Hz whole-screen re-render from the call timer (2 Hz on `/join`)

- `useElapsed` lives in `CallScreen`, so every second the root re-renders. Measured: 1 commit/s.
- The re-render covers the header, `ConnectionIndicator`, `StatusLine`, `Transcript` (not memoised),
  `CallControls`, the **three `CallDialog`s with their closed contents** and 7 `Icon`s.
- The memoised cards and the bridge bail out correctly.
- **`/join` re-renders a second time each second.** `JoinView` (the owner of `useLiveCall`) also runs
  `setInterval(setLeft(secondsLeft(...)), 1000)` for the invite expiry. That keeps running during the live
  call until the 10-minute TTL reaches 0, so the guest side renders at 2 Hz for the first 10 minutes.
- **The keydown listener is re-bound on every render.** `onToggleMute={() => …}` is an inline arrow, so
  `CallScreen`'s effect removes and re-adds the listener on each parent render.

Fix:

- Move the timer into a leaf `<CallTimer since running />`. Also use it for the `more-meta` copy, or read
  it only when the sheet is open.
- In `JoinView`, stop the countdown once `state.phase !== "idle"`.
- `memo` `Transcript` and `CallControls`.
- Wrap `onToggleMute` and `onEnd` in `useCallback`, or read them through a ref inside the keydown effect.
- **Expected:** 0 commits per second in a quiet call.

### 6. LOW: sampler and listener hygiene

- **The local sampler goes stale after `switchDevice("audioinput")`.**
  - LiveKit's `restartTrack` swaps the `mediaStreamTrack`.
  - `localSampler` keeps analysing the stopped track: the meter goes dead and an orphan
    `MediaStreamAudioSourceNode` is left behind.
  - Fix: dispose and null `localSampler` after a successful switch, or listen for `LocalTrackPublished`
    and `TrackRestarted`.
- **`TrackUnsubscribed` does not dispose `translationSampler`.**
  - Its source node stays attached to an ended track until the next subscribe or unmount.
  - Fix: dispose when the unsubscribed track is the sampled one.
- **No `room.removeAllListeners()` on teardown.**
  - It is benign today: `isCurrent()` guards every handler, and the `Room` is dropped after `disconnect`.
  - It is a one-line safety net in `teardownRoom` and in the `Disconnected` handler.
- **The rAF loop wakes every frame (60–120 callbacks/s) to sample at 20 Hz.**
  - Each callback is cheap, but `setInterval(50)` (or rAF only after 50 ms has passed) cuts wakeups by 3–6×
    while someone speaks.
- **`write()` sets `data-active` on every level change, but no CSS selector uses it.**
  - That is an extra attribute mutation and style invalidation per sample.
  - Fix: drop it, or write it only when it flips.
- **The mic check runs `tailMs: Infinity` with its own `AudioContext`** for the whole setup screen.
  - This is by design ("We hear you"). The rAF loop is about 60 callbacks/s.
  - Fix: stop it when the tab is hidden, or once `heard` is true and the device is unchanged.

### 7. LOW (correctness of an optimisation): `sameIds` compares ids only

- If the Platform ever updates a message in place (same id, filled-in `content` or `primary_language`),
  the client keeps the old array and never shows the change.
- Fix: compare `id` + `content.length` + `primary_language` for the last few messages. That is still O(1)
  for unchanged polls.

## Budget check (design system §5.4)

| Budget | Status |
| --- | --- |
| ≤ 2 infinite CSS animations | Pass (1 live, 1 translating, 2 reconnecting) |
| ≤ 2 JS sampling loops, ≤ 20 Hz, stopped when silent | Pass (finding 6 is a refinement) |
| 0 React renders per level sample | Pass (measured) |
| Participant card renders only on state change | Pass |
| 0 UI long tasks > 50 ms | Pass in steady state (unthrottled, so re-check at 4× throttle) |
| No canvas or WebGL on call routes | Pass |
| No animation libraries in the app area | Pass (0 matches) |
| Call screen CSS ≤ 12 KB gz | Pass (6.0 KB) |
| "Noto Sans KR only, `preload: false`, unicode-range slices" | Technically met, but **not cheap**: +26 KB gz render-blocking CSS on every route (finding 1) |
| (not in the budget) first-load JS on `/call` and `/join` | 337/333 KB gz, of which 136 KB is LiveKit (finding 2). **Proposed budget: ≤ 210 KB gz before Join** |

## Suggested order of work

1. Finding 1, font scoping or system Hangul: one file, biggest reach.
2. Finding 2, lazy `livekit-client`.
3. Finding 5, leaf timer and stopping the `/join` countdown.
4. Finding 4, stable turns.
5. Finding 3, abort, timeout and hidden-tab backoff now; incremental messages with the backend.
6. Findings 6 and 7.

Re-measure with the same scripts (prerender HTML chunk sum, a 10 s CDP window, the React commit probe)
under 4× CPU throttle and "Fast 3G". Record before and after in this file.
