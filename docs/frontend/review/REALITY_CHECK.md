# Reality check: phase 1 redesign

Agent 5a (Reality Checker). Date: 2026-10-21. Scope: the uncommitted phase 1 diff, checked against
`workflow/BRIEF.md`, `workflow/DECISIONS.md`, the audit, the UX spec, the design system,
`IMPLEMENTATION_NOTES.md` and `COMPONENTS.md`. Accessibility and performance are covered by other
reviewers and come up here only where the problem is severe or affects correctness. No code was changed.

## Verdict: NEEDS WORK

This is a strong first pass. The product story is now clear, the code is clean and pure where it should be,
and the request shapes match the backend. But I can't certify it as ready to ship.

- **The core realtime path has never run.** No Platform, no Runtime, no LiveKit: every "live" state comes
  from a dev-only fixture or a mocked `livekit-client`.
- **One realtime signal can show the wrong thing.** The "who is hearing the translation" direction depends
  on a Web Audio analyser that may stay suspended on Safari/iOS. When it does, the bridge names the wrong
  listener.
- **The invite copy overstates its security.** The guest's session token in the link never expires, and the
  link is not single-use.

Expect one more revision cycle and one real two-browser ko↔en call before READY.

## Commands run

| Command | Result |
| --- | --- |
| `npm test` | 25 files, **132/132 pass** (vitest 5.0.4, 2.5 s). Two jsdom "canvas getContext not implemented" notices, harmless. |
| `npm run typecheck` | Pass (no output). |
| `npm run build` | Pass. Next 16.3.8 (Turbopack), 20 static pages. `/call`, `/join` and `/call/fixture` are static. |
| `git checkout -- next-env.d.ts` | The build rewrote `.next-dev/dev/types` → `.next/types`. Reverted, and the tree is back to its original state. |
| `git diff --stat -- 'app/(dashboard)/agents' package.json package-lock.json` | Empty: the playground and dependencies are untouched. |
| `grep console. / localStorage` over `components/features/call`, `lib/invite.ts`, `lib/call-*`, `lib/interpreter.ts` | No logging. `localStorage` holds only the setup prefs `vl-call-prefs` (languages, name, pace), no credentials. |
| Backend cross-check | Read `backend.voice-labs/platform/src/platform/{main.py,auth.py,livekit.py}` and `runtime/src/runtime/{interpreter.py,translation_engine.py,audio_routing.py}`. |

Screenshots reviewed: `before/landing-1440`, and `after/landing-1440-light`, `landing-390-light`,
`call-setup-1440-light`, `call-live-fixture-1440-light`, `call-translating-fixture-390-dark`,
`call-waiting-fixture-390-light`, `join-390-light` and `agents-1440-light`.

## What checks out (with evidence)

- **Platform request shapes match the backend.**
  - `SessionIn{agent_id, participant?}` and `ParticipantIn{language, voice_profile_id?, display_name≤100}`
    (`main.py:365-376`) match `lib/platform.ts` `createVoiceSession` and `SessionParticipantInput`.
  - `POST /voice/sessions` returns `session_token` (`main.py:766`). `POST /voice/sessions/{id}/participants`
    returns `{participant_identity, connection, session_token}` (`main.py:878-882`), which matches
    `SessionParticipant`.
  - `GET /voice/sessions/{id}` (`main.py:793-808`) matches `VoiceSessionDetail`.
  - `AgentIn` accepts `mode` + `interpreter`, with `status` defaulting to `"enabled"` (`main.py:274-301`).
    So auto-created interpreters can take calls straight away.
- **Session-token scopes match what the UI does** (`auth.py:52-70`).
  - Only the creator may add the guest (`creator_only=True`).
  - A guest token may `/end`, read the conversation and messages, and `ensure-running`. So the guest's End
    and the guest's polling both work on an auth-enabled Platform.
- **The F3 risk is mitigated in the Runtime.** `one_way` is required for any pair with Korean. In
  participant mode the source is the speaker's declared language (`interpreter.py:716-724`), and each
  participant has a separate STT lane in their own language (`translation_engine.py:184-201`). So `one_way`
  should not make a two-person ko↔en call one-directional. This still needs a live test (B1).
- **End and drop logic match DECISIONS.md #3.**
  - End: confirm → `teardownRoom` → `POST /end` with the session token (`use-call-room.ts:119-140`).
  - Other person drops: `participant-left` → "Reconnecting…" → `PEER_GRACE_MS`=30 s → `endSession("peer-lost")`
    (`use-call-room.ts:235-249`).
  - An unexpected self-disconnect never sends `/end` (`:296-310`), and neither does unmount (`:345-363`).
  - The peer pressing End is picked up by the 1.5 s poll (`use-live-call.ts:63-67`), because the backend
    never deletes the room (no `delete_room` anywhere in the Platform or Runtime). So "Reconnecting…" shows
    for at most about 1.5 s before "{name} ended the call".
- **Invite fragment handling.**
  - The fragment is parsed once, then cleared with `history.replaceState` (`join-experience.tsx:23-35`,
    `invite.ts:120-123`).
  - `/join` sets `referrer: no-referrer` and `noindex` (`app/(call)/join/page.tsx:4-9`).
  - "Open guest view in a new tab" uses `rel="noopener noreferrer"` (`invite-panel.tsx:153`).
  - No logging anywhere.
- **The playground and existing routes are unchanged.**
  - `app/(dashboard)/agents/**` has no diff, and `createVoiceSession(agentId)` still sends only
    `{agent_id}`.
  - `withBearer` returns the `init` unchanged when there is no token (`platform.ts:131-136`), so
    playground requests are byte-identical to before.
  - `endVoiceSession(id)` stays compatible.
- **Landing 5-second test (hero).** "Speak your language. Be heard in theirs." sits next to a two-person
  ko/en card with "Translating into English" (`after/landing-1440-light.png`, `landing-390-light.png`). The
  before version said "Voice AI that speaks your language" with an orb. This is a clear win.
- **Scope.** Only phase 1 items were built. `package.json` is unchanged, there is no design-system library,
  no billing, tenancy or workflow editor, and nothing was committed. `/call/fixture` is dev tooling that
  returns 404 in production (`fixture/page.tsx:15`).

## Findings

### Blocker

**B1. The realtime path has never run end to end.**

*Evidence:*
- `IMPLEMENTATION_NOTES.md` "Known limitations" says so.
- Every call-state screenshot is `*-fixture-*`.
- `__tests__/call-room.test.tsx` mocks `livekit-client`.
- The before screenshots of `/agents` and `/conversations` show only "Can't reach the platform"
  (`after/agents-1440-light.png`).

*Not demonstrated by any run:*
- remote `ActiveSpeakersChanged` and `TrackMuted` for a peer you are not subscribed to;
- the `translation-for-<identity>` subscription and its energy detection;
- the ko↔en participant lanes;
- the 10-minute token rejoin;
- autoplay unblock on iOS.

Brief acceptance criterion 9 ("realtime functionality still works") can't be marked as passing on mocks.

*Fix:* run the UX spec §10 manual check (`VOICE_LABS_UX_SPEC.md:853`). That is one two-browser ko↔en call
with headphones, plus one on iOS Safari. Capture real screenshots of waiting → live → translating → peer
drop → ended, and record what happened in `IMPLEMENTATION_NOTES.md`.

### Major

**M1. The "who is hearing" direction can be inverted when Web Audio is suspended.**

*Evidence:*
- `startTranslationSampler` creates the analyser inside a `TrackSubscribed` handler, with no user gesture
  (`use-call-room.ts:171-189`).
- `createLevelSampler` calls `context.resume()` from `start()`, which is also outside a gesture
  (`level-store.ts:126`), and returns a sampler even when the context stays `suspended`.
- A suspended context reads silence, so `hearing` stays `false`.
- Then `bridgeState` → `toward: "other"` → "Ji-woo is hearing you in Korean" (`call-state.ts:232-234`,
  `:254`), while *you* are the one hearing the translation. `personState` makes the same mistake on the cards
  (`:199`, `:208`).

The brief says animations "must reflect actual system state", and this is a wrong state, not just a missing
one. There is also a brief wrong-direction flicker on every interpreter turn: `speakers` resets
`hearingTranslation` to `false` (`call-state.ts:141`) before the first sample arrives.

*Fix:*
- Create the `AudioContext`, or `resume()` it, synchronously inside the Start call / Join call click
  handlers, and pass it to the hook.
- In the sampler, report `hearing: null` (no direction) while `context.state !== "running"`.
- Seed `hearingTranslation` as `null`, not `false`, at the start of each interpreter turn, so the label
  says "Interpreter speaking" until the first sample.

**M2. The invite security copy is inaccurate, and the guest session token never expires.**

*Evidence:*
- The UI says "It can be used once and expires in 10 minutes" (`invite-panel.tsx:157`; `:127` similar).
  In fact:
  - (a) The LiveKit token can be reused for its whole 10-minute TTL (`livekit.py:28`). A second open only
    kicks the first by duplicate identity (`use-call-room.ts:51`, `:308`).
  - (b) The guest `vls_…` session token is stored as a hash with no expiry (`main.py:875-876`,
    `auth.py:118-131`). It keeps working for `/conversations/{id}`, `/messages` and `/runtime-state` after
    the call is over.
- `replaceState` clears the session-history entry, but the browser's global history and sync may already
  have recorded the full URL with its fragment. So anyone who later has that history can read the whole
  transcript.

*Fix:*
- Frontend, now: change the copy to "Anyone with this link can join as {who} in the next 10 minutes. Opening
  it again moves the call to the new device." Note in `IMPLEMENTATION_NOTES.md` that the transcript stays
  readable with the link.
- Backend ticket: give guest session tokens a TTL, or revoke them on `/end`.

**M3. The landing page contradicts its own new hero.**

*Evidence:*
- The hero says "14 languages" (`landing-page.tsx:39`).
- Further down the same page:
  - `{ value: 2, label: "languages, one conversation", copy: "English and Russian within one conversation." }`
    (`landing-page.tsx:17`);
  - "Agents handle English, Russian, and callers who move between the two…" (`:10`);
  - the Comparison, which says "start in Russian, finish in English" (`comparison.tsx:10`).
- A new user who scrolls finds two different products. That weakens criteria 1 and 7.

*Fix:* a copy-only edit. Reframe those three blocks as "the agent side" (for example "Voice agents: English
and Russian, mid-sentence"), or update them to the interpreter story. No layout work is needed, so it fits
phase 1.

**M4. The primary orchestration has no tests.**

*Evidence:*
- No test renders `CallExperience` or `InvitePanel` (`grep -l "CallExperience\|InvitePanel" __tests__` finds
  nothing).
- So nothing covers:
  - resolve → create → connect, with the cleanup `/end` on each failure branch
    (`call-experience.tsx:121-179`);
  - the `!connection.token` "Calls aren't set up" path;
  - the `selected_voice_unavailable` retry;
  - `addSessionParticipant` → fragment link → `session_full` (`invite-panel.tsx:66-91`).
- This is the flow the brief calls most important, and it is the most likely place for a leaked session.

*Fix:* add 4–5 tests with mocked `lib/platform` and `useCallRoom`:
- start happy path;
- connect-fail ends the session;
- the unmounted-during-create path ends the session;
- invite success builds a `/join#` link containing `k=` and `t=`;
- `session_full` shows "End call and start a new one".

### Minor

1. **A stale room's `Disconnected` handler can wipe the current room.** `removeAudio()` runs before the
   `roomRef.current === room` check (`use-call-room.ts:296-299`). When an earlier `connect` is superseded,
   its `room.disconnect()` (`:315`) fires `Disconnected`. That removes the new room's audio elements and
   samplers. Because `intentionalRef` is `false`, it also dispatches `disconnected`. This is hard to reach
   from the UI today, since the buttons disable themselves. *Fix:* return early when
   `roomRef.current !== room && roomRef.current !== null`, before `removeAudio()`.
2. **The Rejoin copy promises too much.** The banner says "The call is still running for the other person"
   (`call-screen.tsx:186`), but the other side's client ends the call after 30 s (`PEER_GRACE_MS`). *Fix:*
   "Rejoin within 30 seconds, or the call ends."
3. **Rejoin resets the call timer and own-state.** The `connect` action sets `connectedAt: null`
   (`call-state.ts:83`), so after a rejoin the timer shows 00:00. *Fix:* keep `connectedAt`.
4. **The mic meter goes dead after a device switch.** `localSampler` is created once from the first
   `mediaStreamTrack` (`use-call-room.ts:265-268`), and `switchDevice` never rebuilds it (`:398-406`).
   *Fix:* dispose `localSampler` in `switchDevice` for `audioinput`.
5. **`TrackUnsubscribed` doesn't dispose the translation sampler** (`use-call-room.ts:226-231`). It keeps
   analysing a dead track until the next subscription.
6. **Interpreter reuse is loose.**
   - `matchesInterpreter` ignores `direction`, `glossary` and the agent's own `voice_profile_id`
     (`interpreter.ts:46-55`). So a hand-made interpreter with a glossary or voice gets reused silently.
   - If that agent's voice is unavailable, "Use the interpreter's voice" retries only without the
     *participant* voice, and fails again (`main.py:620-625`).
   - Two tabs starting at once create duplicate agents (`interpreter.ts:61-66`), which is harmless but
     visible in `/agents`.

   *Fix:* also require `!agent.voice_profile_id` and `!config.glossary?.length`, and match the description
   marker "Created by Start a call".
7. **Ending a call while it's still connecting shows an error.** Pressing End during `connecting` makes
   `connect` resolve `false`, and `start()` then shows "Couldn't connect the call audio"
   (`call-experience.tsx:166-171`). *Fix:* skip that error when `room.state.phase` is
   `ending`/`ended`.
8. **A session leaks if you navigate away while LiveKit is connecting.** `start()` returns at `:164`
   without `/end`. That is "by design", but nobody else can be in the call yet, so ending it is safe and
   cheaper.
9. **Technical details are mislabelled.** "Engine · pace · direction" prints `mine/theirs` languages, not
   the direction (`call-experience.tsx:246`).
10. **The global token move changes old pages, and nobody has reviewed those changes.**
    - Radii change: `--radius-control` 3→4, `--radius-surface` 5→6, `--radius-window` 6→8.
    - `--accent-dark` changes from #e54b38 to #b5372a in light mode (used at `globals.css:41,43,69,92`).
    - `--ink-3` and `--line-strong` were self-referential and invalid before. They now resolve, across 59
      usages, so borders and text that used to fall back now render.
    - All of this is probably an improvement. But the before/after screenshots of `/agents` and
      `/conversations` show only the error state, so nobody has checked these pages with real data.

    *Fix:* capture `/agents`, `/voices` and `/conversations` with data, before and after.
11. **The `/join` fragment is visible before hydration.** It is stripped in a `useEffect`, so the full URL
    stays in the address bar until the JS runs. Acceptable, but say so in the notes alongside M2.
12. **The workspace nav has both a "Call" link and a "Start a call" button** going to the same place
    (`dashboard-header.tsx`). Drop one, or make "Call" the history view later.
13. **The screenshots were taken in `next dev`.** The Next dev indicator (the "N" badge) covers the End
    button in every call screenshot, so they are not reliable evidence for the dock layout. *Fix:*
    re-capture from `next build && next start`.
14. **Visual: the desktop live screen is sparse.** At rest the bridge is a grey hairline with "Ready"
    (`after/call-live-fixture-1440-light.png`), and the centre column is mostly empty. The A+C seat colours
    work (teal/plum, with a lime bridge in dark), but at 1440 the "one bridge" idea only shows while
    translating. Consider a resting lime node or a language-pair label on the bridge.
15. **`adjustFontFallback: false` on DM Sans** (`app/layout.tsx:11`) removes metric matching on every page,
    so the font swap now causes layout shift. This one is for the performance reviewer.

## Brief acceptance criteria

| # | Criterion | Mark | Reason |
| --- | --- | --- | --- |
| 1 | New user understands Voice Labs in ~5 s | **Partial** | The hero passes clearly (headline + two-person card + "Start a call"). The same page then says "2 languages… English and Russian" (M3). |
| 2 | Starting/joining is obvious | **Partial** | `/call` is a single form: two languages, mic check, Start. `/join` shows "{from} invited you", both language rows and Join. But the invite is a separate step *after* you are in the call. It is one-shot, lasts 10 minutes, and once it expires the only way forward is to end the call and start again (`invite-panel.tsx:160-167`). This is a backend constraint, documented, but still friction. |
| 3 | Participants and languages immediately understandable | **Pass** | Cards show name, "Speaks X / hears Y" and native names. The title is `English ↔ 한국어`, and every language has `lang` (fixture screenshots, `participant-card.tsx`). |
| 4 | Speaking/translation state visually clear | **Partial** | Clear in the fixtures. But "translating" is inferred, and the hearing direction can be inverted (M1). Nothing has been verified live (B1). |
| 5 | Transcript + translated speech easy to follow | **Partial** | The viewer's language comes first, then the original, plus a "What Ji-woo heard" line (screenshots). Pairing is by order and finished utterances only, with a 1.5 s poll. Unverified with real message timing. |
| 6 | Call controls obvious | **Pass** | Mute/Transcript/Details/More on the left and a red End on the right. The phone dock has 3 slots. End needs confirmation, there is no single-key End, and M/T/D are documented. |
| 7 | Communication product, not AI dashboard | **Pass** (call) / Partial (site) | `/call` and `/join` are people-first with no provider chrome (technical details sit behind Details). The workspace is still the old dashboard (phase 2), and M3 leaves an "agents" story in the landing body. |
| 8 | Distinctive identity | **Partial** | The seat colours are a real identity system, and the landing illustration is good. The desktop live screen is sparse, and the bridge is visible only while translating (minor 14). |
| 9 | Realtime functionality still works | **Partial: unverified** | The playground is untouched and its requests are byte-identical, so it is low risk. The new call path has only been run against mocks (B1). |
| 10 | Desktop + mobile intentional | **Pass** | At 390 px the cards stack compactly, the bridge sits between them, the transcript is a full-width column and the 3-slot dock fits (screenshots). At 1440 px there are two cards plus a transcript rail. |
| 11 | Animations aid understanding | **Partial** | Every animation is tied to a signal: levels via CSS vars, a packet only while translating with a 6 s cap, and reduced-motion handling (notes). The direction cue can be wrong (M1). |
| 12 | Maintainable | **Pass** | A pure reducer and transcript module (`lib/call-state.ts`, `lib/call-transcript.ts`). The hook is separate from the playground, there is one place that talks to the Platform, and `COMPONENTS.md` documents it all. The largest file is 436 lines (`use-call-room.ts`), which is reasonable. |
| 13 | No unnecessary deps | **Pass** | `package.json` and the lockfile are unchanged. Noto Sans KR comes from `next/font` with `preload: false`. |
| 14 | Frontend tests pass | **Pass** | 132/132, typecheck and build all pass. The key orchestration is untested (M4). |

## To reach READY

1. Fix M1, M2 (frontend copy) and M3, and add the M4 tests.
2. Then run B1: one real two-browser ko↔en call plus one iOS Safari join, with production-build screenshots
   of each live state.
3. Minors 1, 2 and 7 are cheap and should go in the same cycle.
