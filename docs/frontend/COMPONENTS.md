# Call components

Phase 1 of the redesign (UX spec §10). These are small in-repo React components with plain CSS. There is
no component library and no new dependency. All styling uses the tokens in `app/tokens.css`, so light and
dark themes both work without per-area overrides. The call styles are in `app/(call)/call.css` (about 7 KB
gzipped).

Rules every component follows:

- Visible focus: `outline: 2px solid var(--focus)` on `:focus-visible`. Focus is never shown with a
  box-shadow alone.
- State is always a word plus a shape or icon. Colour is never the only signal. Seat colours are teal for
  *you*, plum for *them* and lime/olive for the *interpreter*.
- Motion uses `transform` and `opacity` only, and runs only while a real signal drives it. Under
  `prefers-reduced-motion: reduce`, meters become a static 3-step indicator, and the packet, spinners,
  breathing and slides stop.
- There is one `role="status"` per page, the status line. No component adds its own live region, apart from
  the transcript's announcement log.

## Logic (no UI)

| Module | What it does |
| --- | --- |
| `lib/call-state.ts` | A pure reducer for a two-person call (`callReducer`). It also provides the derivations `personState`, `bridgeState` / `bridgeLabel`, `statusLine` (precedence: Ended > Sound blocked > Reconnecting > Connecting > Disconnected > Peer reconnecting > Waiting > Interpreter unavailable > Network degraded), `connectionWord`, and `classifyParticipant` (LiveKit `isAgent` or the `voice-labs-agent-` identity marks the interpreter). The reducer returns the same object when nothing changed, so React skips the render. |
| `lib/call-transcript.ts` | `pairCallMessages(messages, {self, other}, now)` builds perspective-aware turns. Attribution comes from language. Pairing is by order and approximate. The statuses are `complete`, `pending`, `timeout` (after 20 s) and `unpaired`. `announcementFor` returns text only for the other person's completed lines. |
| `lib/invite.ts` | `buildInviteFragment` / `buildInviteLink` / `parseInviteFragment` / `stripFragment` / `secondsLeft` / `formatCountdown`. The guest's credentials live only in the URL `#fragment`. |
| `lib/interpreter.ts` | `resolveInterpreter(settings)` reuses an enabled cascaded interpreter with the same pair and options, or creates one with `engine: "cascaded"` explicit. `interpreterAgentBody` and `matchesInterpreter` are exported for tests. |
| `components/features/call/level-store.ts` | `LevelStore` writes audio levels into a `--level` CSS variable on bound elements, so a sample never causes a React render. It skips changes smaller than 0.02. Under reduced motion it uses 3 buckets and writes at most every 500 ms. `createLevelSampler` is an AnalyserNode loop at ≤ 20 Hz that stops by itself after a silent tail. |
| `components/features/call/use-call-room.ts` | `useCallRoom()` is the LiveKit hook for calls, separate from the playground. See "Call hook" below. |
| `components/features/call/use-call-conversation.ts` | `useCallConversation()` is one poll loop per conversation (every 1.5 s, 3 s after a failure). It diffs messages by id and runs `ensure-running` while no interpreter is in the room. Three failures in a row mark the interpreter unavailable. |
| `components/features/call/use-live-call.ts` | Glue for `/call` and `/join`. It combines the room, the poll and transcript pairing, sets the "translating" state from pending originals, detects the end, adds the `beforeunload` prompt, and holds a screen wake lock. |

### Call hook (`useCallRoom`)

```ts
const room = useCallRoom({ otherName });
await room.connect({ url, token, sessionId, sessionToken, tokenExpiresAt, micDeviceId });
room.state;                     // CallRoomState (lib/call-state.ts)
room.levels;                    // LevelStore for meters
room.setMuted(true | false);
room.end();                     // disconnect, then POST /end with the session token (ends for both)
room.startAudio();              // "Tap to turn on sound"
room.rejoin(); room.canRejoin();// same token, only before it expires
room.switchDevice("audioinput" | "audiooutput", id);
room.setVolume(0..1);
room.markEnded(reason);         // polling saw the call end; disconnect and send nothing
```

What it handles, and how:

- LiveKit join with `audioCaptureDefaults` (chosen mic, echo cancellation, noise suppression, AGC), mic
  on, and existing participants classified after connect.
- Remote audio tracks are attached as `<audio data-voice-labs-audio data-voice-labs-call>` on
  `document.body`. This is the same attribute the playground and e2e use. A rejected `play()` sets
  `soundBlocked`.
- Per-listener translation: the Runtime only lets us subscribe to `translation-for-<our identity>`. The hook
  samples that track to tell whether *we* are hearing the translation (direction of the bridge) and to drive
  the bridge level.
- Active speakers become booleans in the reducer. Levels go to the store: the local mic through the
  analyser (≤ 20 Hz, only while speaking plus 600 ms), the other person through `participant.audioLevel`.
- Mute (local and remote `TrackMuted`/`TrackUnmuted` for the microphone source), connection quality,
  `Reconnecting`/`SignalReconnecting`/`Reconnected`, and `AudioPlaybackStatusChanged`.
- Inferred "translating": a person stops speaking while the interpreter is silent, or polling shows an
  original with no translation yet. It clears when the interpreter speaks and always times out after 6 s.
- Ending (product decision 3): End ends the call for both people. An unexpected drop **never** POSTs `/end`;
  Rejoin is offered instead. `DUPLICATE_IDENTITY` shows "in use on another device", and `ROOM_DELETED`
  means the call ended. When the other person leaves, they show as "Reconnecting…" for 30 s, then the call
  ends ("didn't come back"). Unmounting disconnects and sends nothing, the same as closing the tab.

## Components (`components/features/call/`)

| Component | File | Props (main) | Accessibility | States |
| --- | --- | --- | --- | --- |
| `ParticipantCard` | `participant-card.tsx` | `seat`, `name`, `speaks`, `hears`, `state`, `quality`, `levels`, `binaryLevel` | `<article aria-label="Ji-woo, speaks Korean, hears English, speaking">`. The label updates with state, but the card is not a live region. Language text has `lang`. | joining, waiting (dashed, "Not joined yet"), listening, speaking (seat tint + meter), muted (badge + word), hearing translation (lime chip), reconnecting (.6 opacity), left; a "Weak connection" chip when quality is poor or lost |
| `Avatar` | `participant-card.tsx` | `name`, `seat`, `state`, `size` | `aria-hidden`; the name next to it carries meaning | ring per state; mute and warning badges |
| `InterpreterBridge` | `interpreter-bridge.tsx` | `mode`, `toward`, `names`, `levels`, `layout` | `role="img"` with the label as its name; direction is in the words | starting (dashed), ready, translating (packet toward the listener), speaking (solid, arrow, level when we listen), reconnecting, unavailable |
| `LevelMeter` | `level-meter.tsx` | `store`, `source`, `tone`, `active`, `binary`, `size` | `aria-hidden`; the state word beside it is the signal | idle (15 %), active (seat colour), binary (fixed shape that breathes only while speaking), reduced motion (3 steps) |
| `ConnectionIndicator` | `connection-indicator.tsx` | `state` | the word stays in the accessible name even when hidden on phones | good (3 bars), weak (1), lost / offline, reconnecting / connecting (ring) |
| `Transcript` / `TranscriptTurn` | `transcript.tsx` | `turns`, `people`, `announce`, `error`, `hidden` | `<section aria-labelledby>`, a focusable scroll area, and a separate visually hidden `role="log" aria-live="polite"` that carries only the other person's completed lines | empty, primary/secondary per viewer, pending ("Translating into …"), timeout ("No translation received"), unpaired, "Show earlier" after 50, "Jump to latest · N new" |
| `CallControls` | `call-controls.tsx` | `muted`, `onToggleMute`, `onMore`, `onEnd`, `onTranscript`, `onDetails`, `onInvite`, `showInvite`, `shortcuts` | `role="toolbar" aria-label="Call controls"`, arrow-key roving focus. Mute has the fixed name "Mute" + `aria-pressed`. `aria-keyshortcuts` M/T/D only while shortcuts are on. End has no shortcut. | One DOM for every size. On phones, CSS keeps three slots (More · Mic 64 px · End) and the rest move to the More sheet. |
| `StatusLine` | `status-indicator.tsx` | `status`, `extra` | the page's single `role="status"`; the same message is not re-announced within 5 s | neutral, warning, danger; visually hidden when empty on phones |
| `StatusChip` | `status-indicator.tsx` | `kind` | the word is always present; the dot is `aria-hidden` | live, ended, failed, waiting, soon, neutral |
| `EmptyState`, `LoadingState`, `ErrorState` | `call-states.tsx` | title, copy, action; `steps` / `current`; `variant`, `technical`, `alert` | Loading sets `aria-busy`. Errors use `role="alert"` and keep the raw code inside a closed "Technical details". | page, panel, inline, banner |
| `CallDialog` | `call-dialog.tsx` | `open`, `onClose`, `title`, `variant`, `initialFocus`, `footer` | native `<dialog>` with `showModal()` (focus trap, Esc); focus returns to the trigger; `aria-labelledby` | dialog, sheet-bottom, sheet-side |
| `LanguageSelect`, `LanguageReadout` | `language-select.tsx` | `value`, `onChange`, `exclude` | native select; options read "Korean · 한국어" so typeahead works in both languages | editable, read-only |
| `MicCheck` / `useMicCheck` | `mic-check.tsx` | the `mic` object from the hook | fieldset/legend; errors linked with `aria-describedby` | idle, asking, ready ("We hear you"), error (blocked, not found, busy) |
| `InvitePanel` | `invite-panel.tsx` | session ids and token, names, languages, `invite`, `onInvite`, `onExpiredRestart` | Copy gets focus when the link exists; the countdown is not live | create, link (Share…, Copy, open guest view), copy blocked (select + hint), expired, `session_full` |
| `CallScreen` | `call-screen.tsx` | `role`, `state`, `levels`, `self`, `other`, `turns`, handlers, `invite`, `technical` | `<main>`, h1 = language pair (focused on connect), `<section aria-label="Participants">`, transcript section, toolbar, End confirm (focuses Cancel), More sheet, Technical details | everything above, composed per UX spec §5 |
| `CallEnded` | `call-ended.tsx` | `state`, `self`, `other`, `turns`, `endedAt`, `conversationId`, `onStartAnother` | the heading is focused on appear | summary, last 3 pairs, links |
| `CallExperience` | `call-experience.tsx` | none | | `/call`: setup → live → ended |
| `JoinExperience` | `join-experience.tsx` | none | | `/join`: reads and strips the fragment; invalid / expired / ended / join / live / ended |
| `CallFixture` | `call-fixture.tsx` | `name` | | dev-only mocked screen (`/call/fixture?state=live\|waiting\|translating\|reconnecting\|ended`), 404 in production |

## Fix round 1 additions

- `useCallRoom().primeAudio()` must be called synchronously in the Start, Join and Rejoin click handlers. Analysers run only on a running AudioContext. The bridge shows no hearing direction until our own track has been measured.
- `livekit-client` is loaded with `import()` inside `connect()`. `preloadLiveKit()` warms it after the mic check.
- `CallTimer` is a leaf timer. `LanguageName` puts `lang` only on native-script text.
- Shortcuts work only with focus inside the call screen and can be switched off in More.
- `useCallConversation` aborts after 5 s, never overlaps, and pauses while the tab is hidden. `mergeMessages` / `reuseTurns` keep object identity.
- Noto Sans KR loads only in `app/(call)/layout.tsx`. Other routes use system Hangul faces.

## Navigation (`components/features/agents/dashboard-header.tsx`)

- Desktop (≥ 1024 px): Call, Conversations, Agents, Voices, Usage (`/analytics`), and **More ▾**
  (Campaigns, Knowledge, Tools). Then Search (⌘K), the theme switch, and **Start a call**, which is hidden
  on `/call`.
- Below 1024 px there is a **Menu** button that opens a native `<dialog>` sheet with three groups:
  Communicate, Build, Account. Its links exist only while it is open. Below 640 px, Start a call becomes an
  icon button that keeps the accessible name "Start a call".
- The workspace layout gains a "Skip to content" link.
- The command palette gains "Start a call", and "Analytics" is shown as "Usage".

## Landing

The hero is unchanged from before the redesign (product-owner decision, review round 1): "Voice AI that
speaks your language." with the code-switching line, the "Try live voice ↗" (`/agents`) and "See how it
works ↓" (`#platform`) CTAs, the animated orb with the "Speak to it" voice preview, and the hero network
canvas. The temporary `hero-call-illustration.tsx` was deleted. `app/(marketing)/motion.css` pins the
pre-redesign radii, light `--accent-dark` and the code-switch line colour on `.hero-stage`, so the token
move does not alter the hero. The landing's only redesign changes are in the header and footer: "Workspace"
and a **Start a call** button (`.header-start`), with the same links in the mobile menu.
