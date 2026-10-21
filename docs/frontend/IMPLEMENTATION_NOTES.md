# Implementation notes: phase 1

Agent 4 of 5 (Frontend Developer). Date: 2026-10-21. Scope: UX spec §10 phase 1 only, following
`workflow/DECISIONS.md`. Nothing was committed, and no dependencies were added.

## What was built

1. **Tokens and fonts**
   - `app/tokens.css` defines global light and dark tokens: `:root`, `html[data-vl-theme="dark"]`, and a
     no-JS `prefers-color-scheme` fallback.
   - It fixes the three self-referential tokens (`--ink-3`, `--line-strong`, `--band-ink-2`) and moves
     `--muted` to `#6b6d69` (4.79:1).
   - Every old token name stays as an alias. `--ease-expo` is defined once.
   - Fonts: Noto Sans KR (`preload: false`) is added as `--font-hangul`. Manrope is second in `--sans` to
     cover Cyrillic. DM Sans uses `adjustFontFallback: false` so Cyrillic falls through to Manrope instead
     of Arial.
2. **Platform API** (`lib/platform.ts`), shapes verified in `backend.voice-labs/platform/src/platform/main.py`
   and `auth.py`:
   - New types: `InterpreterConfig`, `Agent.mode` / `interpreter`, `VoiceSession.session_token`,
     `SessionParticipantInput`, `SessionParticipant`, `VoiceSessionDetail`.
   - `createVoiceSession(agentId, participant?)`, `addSessionParticipant`, `getVoiceSession`.
   - An optional Bearer token on session-scoped routes (`withBearer`). Without a token, requests are
     byte-identical to before.
   - `lib/languages.ts` has the 14 interpreter languages with native names and the auto-direction set.
   - `lib/interpreter.ts` handles auto-create and reuse, with `engine: "cascaded"` always explicit and
     `direction` `one_way` for Korean, Chinese, Turkish and Polish.
   - `lib/platform-errors.ts` gains copy for the new error codes.
3. **Call hook** `useCallRoom` (`components/features/call/use-call-room.ts`), separate from the playground,
   plus `useCallConversation` (polling) and `useLiveCall` (glue). Details are in `COMPONENTS.md`.
4. **Routes** `app/(call)/`. This route group has no workspace navigation, no canvas and no footer.
   - `/call`: setup → live → ended.
   - `/join`: the guest view. Credentials are in the `#fragment`, which is stripped with
     `history.replaceState` straight after parsing and is never logged or rendered.
   - `/call/fixture`: dev only, returns 404 in production.
5. **Call components**: participant card, interpreter bridge, level meter, connection state, transcript and
   translation lines, the dock with the 3-slot phone bar, status line and chip, empty/loading/error states,
   dialogs and sheets, mic check, and invite panel.
6. **Navigation**
   - New workspace header with More ▾, Start a call, a menu `<dialog>` sheet below 1024 px, and a skip link.
   - The command palette gains "Start a call".
   - Landing: the marketing header gains "Workspace" and a "Start a call" button (also in the mobile menu
     and footer). The hero is unchanged from HEAD (owner decision in review fix round 1; see below).
7. **Tests**: 6 new files, 45 new tests: `call-room`, `call-state`, `call-components`, `join-invite`,
   `platform-call` and `navigation`.
8. **Docs**: `docs/frontend/COMPONENTS.md`. Screenshots are in `docs/frontend/screenshots/{before,after}/`,
   taken with `docs/frontend/screenshots/capture.mjs`.

## Files changed

- **Modified**:
  - `app/layout.tsx`, `app/globals.css` (tokens moved out; skip-link colours)
  - `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard.css`
  - `app/(marketing)/layout.tsx`, `app/(marketing)/motion.css`
  - `components/features/agents/dashboard-header.tsx`, `components/features/agents/command-palette.tsx`
  - `components/features/landing/mobile-navigation.tsx`,
    `components/features/landing/theme/theme-toggle.tsx` (`.call-root` fade fallback)
  - `lib/platform.ts`, `lib/languages.ts`, `lib/platform-errors.ts`
- **New**:
  - `app/tokens.css`, `app/(dashboard)/navigation.css`
  - `app/(call)/{layout.tsx, call.css, call/page.tsx, call/fixture/page.tsx, join/page.tsx}`
  - `components/features/call/*` (21 files)
  - `lib/{call-state,call-transcript,interpreter,invite}.ts`
  - 6 test files
  - docs and screenshots
- **Not touched**: the playground page, its CSS and its tests; the backend; `package.json`.
  `next-env.d.ts` was reverted after builds.

**Tested strings.** No existing test was edited, and all 87 original tests pass unchanged. The landing kept
an in-page anchor ("See how it works", `#platform`) so the anchor test still holds. Deliberate copy changes
that no test asserts:

- the nav label "Analytics" became "Usage", as a label only (the route is unchanged);
- the marketing header's "Platform access" became "Workspace" plus "Start a call";
- the footer link "Open platform" became "Start a call" / "Open workspace".

The hero copy, the landing body copy (capabilities, facts, comparison) and the page metadata are back at
their HEAD text (review fix round 1).

## Assumptions for the open questions (spec defaults unless DECISIONS.md says otherwise)

| Q | Assumption |
| --- | --- |
| 1 Auto-create | Yes (decision 2). The interpreter is reused when the language set, cascaded engine, pace and hear-original setting match and the agent is `enabled`. |
| 2 Invite security | The link carries the guest LiveKit token and guest session token in the fragment. The LiveKit token can be **reused for its whole 10-minute TTL** (opening it again moves the call to the newer device), and the guest session token **does not expire**. The UI says to treat the link like a password. `/join` sets `robots: noindex` and `referrer: no-referrer`, and strips the fragment after hydration. |
| 3 End for both | Yes (decision 3). Both roles see End, which needs confirmation ("End the call for both of you?"). There is no Leave action. |
| 4 Drop | Decision 3: the other person shows as "Reconnecting…" for 30 s (`PEER_GRACE_MS`). If they do not return, the client ends the call and shows "didn't come back". If polling sees the conversation ended first, it shows "{name} ended the call". |
| 5 Guest UI language | English UI, with native language names. |
| 6 Names in history | Not persisted (needs backend). Names exist only in the live call. |
| 7 More menu | Campaigns, Knowledge and Tools go under More. |
| 8 Default pace | Balanced. |
| 9 Hear real voice | Offered in setup, off by default. |
| 10 Auth | Assumes an auth-disabled Platform for `/agents` and session creation. Session-scoped calls send the session token, so polling and End work on an auth-enabled Platform. |

Other assumptions:

- Unmounting or leaving the page sends no `/end`, the same as closing the tab.
- The creator's identity in Technical details is assumed to be `browser-<session_id>`.
- "Open full transcript" is shown to the creator only, because the conversation page sends no guest token.

## Known limitations

- **Backend ticket needed: token lifetime.**
  - Guest session tokens (`vls_…`) are stored as a hash with no expiry (`main.py:875-876`, `auth.py:118-131`). Anyone holding an old invite link can read that conversation's transcript and messages indefinitely.
  - The guest LiveKit token is reusable for its 10-minute TTL; it is not single-use.
  - The fix needs backend work: a TTL on guest session tokens, revocation on `/end`, and ideally a short-lived invite code instead of raw tokens in the link.
  - `/join` strips the fragment in an effect, so the full URL is in the address bar, and possibly in global browser history or sync, until JavaScript runs.
- **Backend ticket needed: incremental messages.** `GET /conversations/{id}/messages` has no `after` / ETag support. Each 1.5 s poll downloads the whole transcript (about 126 KB raw at 600 messages). The client already merges by id, so `?after=` or `If-None-Match` → 304 can be adopted without UI changes.
- **Backend ticket needed: a second invite / a longer-lived invite code.** `addSessionParticipant` returns `session_full` after the first guest, so an expired or lost link can only be fixed by ending the call and starting again (Reality criterion 2).
- **Backend ticket needed: idempotent interpreter creation.** Two tabs that start a call at the same moment can each create an interpreter agent (Reality minor 6). A server-side unique key on the language set, engine and pace would fix it.
- **Backend ticket needed: participant names in history.** Display names are not stored on the conversation, so `/conversations` cannot show who took part (Q6).
- **Backend ticket needed: guest transcript access after the call.** This is part of the token-lifetime ticket: decide whether a guest may read the transcript after `/end` at all, then enforce it server side.

- **No live end-to-end run.** The Platform, Runtime and LiveKit were not running.
  - These have **not** been verified against a real call: the ko↔en `one_way` behaviour (F3), remote
    active-speaker and mute events without a subscription, translation-track energy detection, and the
    10-minute token rejoin.
  - Before screenshots therefore show the "Can't reach the platform" error states. Live call states come
    from the dev-only fixture route.
- The "translating" state is inferred: from speech timing, or from an original with no translation yet. It
  times out after 6 s. Pairing an original with its translation is by order and approximate (labelled in
  Technical details).
- After a reload, the creator loses the call (credentials are held only in memory, as designed). Ending the
  call and starting again is the only path. `session_full` offers that.
- The phone's 3-slot bar keeps Invite, Details and Output in the More sheet; there is no separate invite
  bottom sheet. Output device switching appears only where `setSinkId` exists.
- Deferred, per DECISIONS.md: agent test layout, conversation pages, latency key fix, interpreter mode in
  the agent form, `/settings`.
- `dashboard-dark.css` and the hard-coded hex colours in the workspace CSS are unchanged. That migration is
  phase 2.
- At 390 px the marketing header is tight. With the new "Start a call" button, "VOICE LABS" wraps onto two
  lines (`after/landing-390-light.png`). This is header-only; the hero is unaffected. To be fixed in the phase 2 header pass.
- Polling has no idle backoff yet (3 s after several unchanged polls while nobody speaks). It pauses while
  the tab is hidden, which is the larger saving.
- The call screenshots in `after/` come from `next dev`, because the fixture is dev-only. The dev indicator
  is hidden by CSS.

## Performance notes

- **Levels never go through React.** `LevelStore` writes `--level` on bound elements, so there are 0 renders
  per sample.
  - The local mic analyser samples at ≤ 20 Hz, only while you are speaking plus 600 ms.
  - The translation-track analyser runs only while the interpreter speaks, plus 900 ms.
  - The remote person uses the server-rate `audioLevel` with no loop.
- The reducer returns the same state object for no-op events. Participant cards and the bridge are `memo`.
  The transcript diffs polled messages by id, so an unchanged poll is the same array and causes no render.
- There is one poll loop per call, keyed on the conversation, so phase changes do not restart it.
- No canvas, GSAP, anime.js or Lenis on `/call` and `/join`.
  - Infinite animations are limited to the bridge packet (only while translating, at most 6 s), the
    reconnect spinner, and the binary meter breath (only while speaking).
  - `call.css` is about 7 KB gzipped; `tokens.css` is about 2.6 KB gzipped.
- The landing hero is the HEAD hero again (orb, anime.js, hero canvas), so landing JS equals HEAD
  (251.6 KB gz). `/call` and `/join` no longer ship `livekit-client` in first-load JS (see round 1).
- Noto Sans KR is self-hosted as 136 unicode-range slices, not preloaded. The browser fetches only the
  slices for Hangul glyphs on screen.

## Accessibility notes

- **Status and announcements**
  - There is one `role="status"` per call page, the status line. It follows the precedence in
    `statusLine` and does not repeat a message within 5 s. Speaking/listening flips are never announced.
  - Transcript announcements go through a separate visually hidden `role="log"`. They carry only the other
    person's completed lines in the viewer's language, and can be turned off in More.
- **Language and labels**
  - Every transcript line and language name has `lang`. Korean uses `word-break: keep-all`.
  - Cards are `<article>`s with a full-sentence label. The bridge is `role="img"` with the direction in
    words. Meters are `aria-hidden`, with the state word beside them.
- **Keyboard**
  - The toolbar uses roving arrow keys. Shortcuts are M, T and D, and are ignored while typing or when a
    dialog is open. There is no shortcut for End.
  - The End confirm focuses Cancel. Focus moves to the call heading on connect and to the summary heading
    on end. Dialogs and sheets are native `<dialog>` and return focus to their trigger.
- **Focus and skip links**: there is a visible 2 px `--focus` outline on call routes and in the workspace,
  which also overrides the old box-shadow-only focus styles. Skip links were added to the workspace and the
  call layout.
- **Reduced motion**: meters use 3 buckets, written at most every 500 ms. No packet, breathing, slides or
  turning spinners. The arrow stays static.
- **Contrast**: new pairs use the design system's measured tokens. White on `--danger-solid` is 6.57:1
  (light) and 5.37:1 (dark). Lime appears as text only in dark; light uses `--interp-ink`.

## Verification

- `npm test`: 25 files, 132 tests, all passing (the baseline was 19 files and 87 tests).
- `npm run typecheck`: passes.
- `npm run build`: passes, with 20 static pages. `/call`, `/join` and `/call/fixture` are static, and the
  fixture renders a 404 in production.
- Screenshots: `before/` has 8 (light, 1440 and 390). `after/` has 48: 12 pages × 2 widths × light and dark.

## Review fix round 1

Inputs: `review/REALITY_CHECK.md`, `review/ACCESSIBILITY_AUDIT.md`, `review/PERFORMANCE_REVIEW.md`.

### Reality check

| ID | Status | What changed / why |
| --- | --- | --- |
| B1 | Deferred | Needs a running Platform, Runtime and LiveKit plus a second device. That is outside what this environment can do. It is still required before READY. |
| M1 | Fixed | `primeAudio()` creates or resumes the AudioContext synchronously in the Start call, Join call, Rejoin and "Tap to turn on sound" clicks (and the mic check does the same in its own click). Analysers are only built on a context whose `state === "running"`. Every interpreter turn starts with `hearingTranslation: null`, so the bridge says "Interpreter speaking" with no direction until our own track has actually been measured. A context that is suspended again reports null. The sampler no longer calls `resume()` outside a gesture. Tests: `call-room.test.tsx`, "never guesses who is hearing". |
| M2 | Fixed | The invite copy says "Treat this link like a password", says it can be used to join for 10 minutes, says opening it again moves the call, and says it gives transcript access. "Used once" is gone everywhere, including the join error copy and the Q2 row above. Added the "Backend ticket needed: token lifetime" limitation. |
| M3 | Resolved by owner decision | The product owner asked for the original hero ("Voice AI that speaks your language."), exactly as at HEAD. The hero, capabilities, facts, comparison and page metadata are all back at HEAD, so the landing consistently tells the English/Russian voice-agent story and no longer contradicts itself. Moving the landing to the call story is a product decision for a later round. |
| M4 | Fixed | `__tests__/call-experience.test.tsx` covers start → resolve → create → connect, a connect failure that ends the session, an empty token, unmount during create, the voice retry, invite-link creation (parses the `/join#` link for the guest LiveKit token `t` and the guest session token `k`), `session_full`, and the 1-minute warning. |
| minor 1 | Fixed | The `Disconnected` handler of a superseded room returns before touching anything. Tested. |
| minor 2 | Fixed | The Rejoin copy now says "if you're not back within about 30 seconds, the call ends for {name} too". |
| minor 3 | Fixed | `connect` keeps `connectedAt` on rejoin. Tested. |
| minor 4, 5 | Fixed | The local sampler is disposed after `switchDevice("audioinput")`. The translation sampler is disposed when its track is unsubscribed. |
| minor 6 | Fixed (partly) | Reuse now skips interpreters that have their own voice or a glossary. Duplicate agents from two simultaneous tabs are deferred: harmless, and fixing it needs a server-side unique key. |
| minor 7 | Fixed | Pressing End while connecting no longer shows a connect error (`wasEnded()`). Tested. |
| minor 8 | Fixed | Unmounting while LiveKit is connecting ends the session; nobody else can be in it yet. |
| minor 9 | Fixed | Technical details now show the real direction (`one_way`/`auto`), with the languages on their own row. |
| minor 10 | Deferred | Needs a Platform with data to screenshot `/agents` and `/voices` with real content. |
| minor 11 | Documented | See the token-lifetime limitation. |
| minor 12 | Deferred | UX spec §3.1 asks for both a "Call" nav item and a "Start a call" button. The plan is to make "Call" a calls hub in phase 2. |
| minor 13 | Fixed (partly) | `capture.mjs` hides the Next dev indicator. Screenshots are still taken from `next dev`, because the call fixture is dev-only by design. |
| minor 14 | Deferred | A visual change to the resting bridge. Out of scope for a fix round. |
| minor 15 | Deferred | `adjustFontFallback: false` on DM Sans is deliberate: it lets Cyrillic reach Manrope. Possible CLS on the font swap; to be measured in phase 2. |

### Accessibility audit

| ID | Status | What changed |
| --- | --- | --- |
| S1 | Fixed | "Start call" stays mounted (`aria-disabled` and `aria-describedby` give the reason, with the loading state shown beside it). The mic check moves focus to the "asking" hint, then to the result line or "Try again". A start error focuses its title. Submitting without a mic moves focus to "Check microphone". Tested. |
| S2 | Fixed | `.call-root a:not(.skip-link)`, plus an explicit skip-link colour. |
| S3 | Fixed | Shortcuts fire only while focus is inside the call screen, never while typing or with a dialog open. They can be turned off in More (stored as `vl-call-shortcuts`), and `aria-keyshortcuts` follows the setting. Tested. |
| S4 | Fixed | One-off status messages: "You're muted." / "Microphone on.", "{name} joined the call.", "{name} is back.", "Reconnected." Each clears after 5 s. Tested. |
| S5 | Fixed | `scroll-padding-bottom` / `scroll-margin-bottom` of 168 px under the sticky bar on phones. |
| S6 | Fixed | Reconnecting and joining cards no longer fade text. They use `--surface-2`, a dashed rule and `--text-2`, and only the decorative avatar and meter are dimmed. |
| M1 | Fixed | A new `LanguageName` component puts `lang` only on the native-script part, everywhere. Tests updated: English names now assert no `lang`. |
| M2 | Fixed | `StatusLine` starts empty and fills 100 ms after mount. |
| M3 | Fixed | While a `role="alert"` banner is shown (sound blocked, disconnected, end failed), the status line stays empty for that condition. Tested. |
| M4 | Fixed | Mute has the fixed name "Mute" plus `aria-pressed`; the visible word ("Unmute") is `aria-hidden`. Test updated. |
| M5 | Deferred | "We hear you" and "Link copied" are not announced through the status line yet. That needs a page-level status context, phase 2. |
| M6 | Fixed (Start) | `aria-disabled` plus `aria-describedby` (hint and error). The Join button still uses `disabled`, deferred. |
| M7 | Fixed | The creator gets "The invite link expires in 1 minute." (and expiry) through the status line. The guest warning uses `left <= 60` with a fired-once ref. Tested. |
| M8 | Fixed | The workspace search, palette and agent-form inputs get a 2 px `--focus` outline again. |
| M9 | Fixed | Below 500 px of height the page scrolls instead of the panes, the dock is sticky, and the transcript has `min-height: 60dvh`. Not re-measured with Playwright at 320×256. |
| M10 | Fixed | Pressed dock toggles use a `--border-control` border plus a 2 px `--text` bar. |
| m1 | Fixed | The timer uses sr-only "Call time" text instead of `aria-label`. The transcript scroller is `role="group"` with its "Transcript lines" label. |
| m2 | Fixed | The banners and the dock now sit inside `<main>`. |
| m4 | Fixed (partly) | Coarse-pointer 44 px for sized and icon call buttons and the theme toggle. Workspace header buttons are deferred. |
| m5 | Fixed | The End confirm has `aria-describedby` pointing at the consequence. |
| m6 | Fixed | "Keyboard shortcuts" and "Coming later" are now `<h3>`. |
| m8 | Fixed | Per-message 5 s debounce. |
| m9 | Fixed | The waiting border uses `--text-2`, unlit bars use `--state-idle`, and the connection word stays visible on phones unless the connection is good. |
| m10 | Fixed | Hiding the transcript with focus inside it moves focus to the Transcript toggle. |
| m11 | Fixed | A global reduced-motion `animation-duration` override in `tokens.css`. |
| m3, m7 | Deferred | m3: roving tabindex vs all-tabbable is a pattern choice; all buttons stay tabbable on purpose. m7: accepted by the auditor. |

### Performance review

| ID | Status | What changed |
| --- | --- | --- |
| 1 | Fixed | Noto Sans KR moved from the root layout to `app/(call)/layout.tsx`. Other routes use system Hangul faces (`--font-hangul-system`). `:lang(ja)` / `:lang(zh)` use Hiragino / PingFang / YaHei, so Han characters are no longer drawn with Korean glyphs. The call title's `↔` is now an SVG icon. |
| 2 | Fixed | `livekit-client` is loaded with `import()` inside `connect()`, and preloaded once the mic check passes (`preloadLiveKit`). Only types are imported statically. The playground is untouched. |
| 3 | Fixed (frontend) | Polling:<br>• never overlaps (a guard plus a chained timer);<br>• has an `AbortController` per tick with a 5 s timeout, aborted on unmount;<br>• pauses while `document.visibilityState === "hidden"` and polls immediately when visible again.<br>Incremental fetch is not possible: the backend has no `after` / ETag, so it is a backend ticket. The idle backoff (3 s after several unchanged polls) is deferred. Tested. |
| 4 | Fixed | `mergeMessages` keeps message identity and `reuseTurns` keeps turn identity, so `memo(TranscriptTurn)` holds. `Transcript` and `CallControls` are memoised. Tested. |
| 5 | Fixed | `CallTimer` is a leaf, and in More it runs only while the sheet is open. Both invite countdowns (the `/join` lobby and the creator's invite panel) are now the `<InviteCountdown>` leaf (`invite-countdown.tsx`). The parent holds `useInviteStage`, which changes state only at the 1-minute and expiry boundaries. Before this, the whole lobby re-rendered at 1 Hz, including the mic check and form. The lobby clock stops once the call starts. Tested (`inviteStage` boundaries). Handlers are `useCallback`, and the keydown listener reads its handlers through a ref, so it is not re-bound on every render. |
| 6 | Fixed | Stale local sampler after a mic switch, translation sampler cleanup, `removeAllListeners` on teardown, a `setInterval(50)` sampler instead of per-frame rAF, and `data-active` written only when it flips. The mic-check loop still runs for the whole setup screen (by design). |
| 7 | Fixed | `mergeMessages` compares id, content, language and role, so a message filled in place shows up. |

### Size deltas

Measured the same way as `review/PERFORMANCE_REVIEW.md` ("Key numbers"): gzip -9 of every CSS and JS file
referenced by the prerendered HTML after `npm run build`. "Review" is the reviewed tree; HEAD is the commit
before the redesign.

| Route | CSS: review → now (HEAD) | JS: review → now (HEAD) |
| --- | --- | --- |
| `/` | 43.3 → **16.7 KB** (15.6) | 231.6 → 251.6 KB (251.6): the HEAD hero is back, with the orb and anime.js |
| `/conversations` | 44.9 → **19.1 KB** (17.3) | 186.4 → 186.5 KB (185.5) |
| `/agents/new` | 44.9 → **19.1 KB** (17.3) | 191.0 → 191.0 KB (189.2) |
| `/call` | 40.9 → 41.5 KB (the Noto `@font-face` now lives only here) | 336.9 → **203.0 KB** (−133.9) |
| `/join` | 40.9 → 41.5 KB | 333.0 → **198.8 KB** (−134.2) |

The remaining CSS cost on non-call routes over HEAD (+1.1 to +1.8 KB) is `tokens.css` and `navigation.css`.

### Owner decision: the original landing hero is restored

The product owner asked for the landing hero to stay exactly as it was before the redesign.

- `components/features/landing/landing-page.tsx` and `comparison.tsx` are byte-identical to HEAD. That
  restores the headline "Voice AI that speaks your language." with the code-switching line, the subhead,
  the "Try live voice ↗" (`/agents`, its original target) and "See how it works ↓" CTAs, the
  animated orb with the VOICE / 01 "Speak to it" preview, and the hero network canvas.
- `hero-call-illustration.tsx` and its CSS were deleted; nothing else used them. The page metadata is back
  at HEAD too.
- The token move changed three things the hero uses. `app/(marketing)/motion.css` pins the HEAD values on
  `.hero-stage`:
  - radii of 3 and 6 px;
  - light `--accent-dark` of `#e54b38`;
  - in light, the code-switch line inheriting the headline colour. At HEAD, `--ink-3` was a self-reference and resolved to nothing.
- Dark mode needed nothing: `theme-dark.css` already sets those tokens on `.marketing-root`.
- After screenshots (`after/landing-{1440,390}-{light,dark}.png`) match `before/landing-*.png` in the hero.
  Only the header differs (Workspace and Start a call).
- No landing test was edited. The existing landing tests pass unchanged.
- Reality M3 is resolved by this decision. The whole landing now consistently says English/Russian.

### Verification after round 1

- `npm test`: 27 files, 154 tests passed. The baseline was 87; round 1 added 22 tests and 2 files.
- `npm run typecheck` and `npm run build` both pass. `next-env.d.ts` was reverted after the build.
- Landing after screenshots (4) were retaken from `next dev` with the dev indicator hidden.
- The call screenshots from the earlier part of round 1 were not retaken. The later fixes (countdown leaf
  and the transcript `role`) change nothing visible.
