# Voice Labs UX specification

Agent 2 of 5 (UX Architect). Date: 2026-10-21. Status: spec for review; no production code changed.

Inputs: the redesign brief (`docs/frontend/workflow/BRIEF.md`), `docs/frontend/FRONTEND_AUDIT.md`,
the frontend at `08c6a47`, and a read-only pass over `backend.voice-labs` to confirm the contracts
this spec depends on. Visual language (colour, type, motion tokens) is Agent 3's job. This
document fixes structure, behaviour, states and scope.

Rule used throughout: **design only what the Platform API and LiveKit actually give us.**
Anything else is labelled **Future: requires backend**, with a note on what is missing.

---

## 0. Backend facts this spec relies on (verified in code)

These facts were checked in the backend in addition to the audit. Several of them change the design.

| # | Fact | Evidence | Design consequence |
| --- | --- | --- | --- |
| F1 | Two-person calls need an agent with `mode:"interpreter"` **and engine `cascaded`**. If not, `POST /voice/sessions/{id}/participants` returns 422 `participants_require_cascaded_interpreter`. | `platform/main.py:552-569` | The start-call flow must pick or create a *cascaded* interpreter. |
| F2 | `latency_mode:"instant"` silently switches to the `realtime` engine when `engine` is not set explicitly and direction is `one_way`. That breaks two-person calls. | `main.py:185-207` docstring | When the frontend creates an interpreter it always sends `engine:"cascaded"`. |
| F3 | `direction:"auto"` needs both languages in `{en,es,fr,de,hi,ru,pt,ja,it,nl}`. **Korean, Chinese, Turkish and Polish are not in that set.** | `validation.py:36`, `main.py:146-155` | A Korean ↔ English interpreter must be created with `direction:"one_way"`. In participant mode the Runtime takes the source from the speaker's declared language (`interpreter.py:720-724`), so this should not limit the two-way call. **Verify with one real ko↔en call before release.** |
| F4 | The creator must send `participant` when creating the session. Without it the contract has no participants, and adding a guest returns 409 `participants_not_enabled`. | `main.py:688`, `:835-837` | The start flow always sends `participant:{language, display_name?, voice_profile_id?}`. |
| F5 | A session holds at most 2 people. Adding the guest **uses up the slot right away**, even if nobody ever joins with that token. | `main.py:838-839`, `:872-873` | A guest link can be generated **once per call**. If it expires unused, the call cannot be rescued. The UI must say so. |
| F6 | LiveKit tokens have a 10-minute TTL. | `livekit.py:28` | The guest link shows a countdown. The guest has to *join* within 10 minutes. |
| F7 | A guest `session_token` may call `GET /conversations/{id}`, `/messages`, `/runtime-state`, `GET /voice/sessions/{id}`, `ensure-running` and **`end`**. Only `participants` is creator-only. | `auth.py:52-72` | The guest can read the transcript, and **either person's "End" ends the call for both**. |
| F8 | The Runtime stores the speaker's original **before** translating, and stores the translation only **after** the full translation is done. | `interpreter.py:731-740` then `:845` | In polled messages, an original that has no translation after it yet is an honest "translating" signal (see §5.3). |
| F9 | The interpreter emits only `TranscriptFinal` and `LatencyMeasured`. It does **not** emit `AgentSpeechStarted`/`TurnCompleted`. | `interpreter.py` `_emit` call sites | The "Conversation activity" labels of the agent playground do not apply to interpreter calls. Speaking-translation state must come from LiveKit. |
| F10 | Identities: creator `browser-<session_id>`, guest `guest-<hex8>`, Runtime `voice-labs-agent-<room>` with LiveKit `kind: agent`. | `main.py:666`, `:851`; `runtime/pipeline.py:170-174` | The client can tell *the other human* apart from *the interpreter*. |

---

## 1. Product framing and the five-second goal

**What Voice Labs is, in one line:** *Two people talk, each in their own language, and each hears
the other in theirs, live.*

Agents, STT, TTS, LiveKit and providers are how this works. They are not what the product is.

### 1.1 What the first screen must say within about 5 seconds

A new visitor must leave the landing hero knowing three things:

1. **What**: live spoken translation between people.
2. **For whom**: me and someone who speaks another language.
3. **What to do**: start a call.

Required hero content (Agent 3/4 own the wording; this is the minimum):

- **Headline** in the form "Speak your language. Be heard in theirs." Reason: it states the outcome
  for people. "Voice AI that speaks your language" states the technology and reads as a bot builder
  (audit §2).
- **One sub-line**: "Voice Labs puts a live interpreter between two people on a call. You speak
  naturally; each of you hears the other in your own language."
- **A static, true-to-product illustration**: the two-lane participant pair from the real call
  screen, e.g. "Ji-woo · Korean → hears English" and "Alex · English → hears Korean", with one
  transcript pair under it. Reason: showing the actual UI teaches the mental model faster than an
  abstract orb, and it is cheap (no canvas, no scroll pinning).
- **Primary CTA "Start a call"** → `/call`. **Secondary CTA "Build a voice agent"** → `/agents`.
  Reason: people talking to people comes first, and AI agents stay one click away.
- Supported languages line: "Korean, English, Japanese, Chinese, Spanish … 14 languages".

What to remove from the hero: the pinned/scrubbed showcase and parallax, and the animated orb as
the hero subject. Reason: the brief rules out "huge hero animations", and those three things carry
most of the motion cost (audit §2, §8). The landing contracts in §9 still apply.

### 1.2 Vocabulary (use these words in the UI)

| Concept | UI word | Not |
| --- | --- | --- |
| Two-person translated session | **Call** | "session", "room" |
| Session with an AI agent | **Agent test** / "Talk to {agent}" | "Playground" in primary UI (fine in dev copy) |
| Stored record of either | **Conversation** | "voice session" |
| `mode:"interpreter"` agent | **Interpreter** (e.g. "Korean ↔ English interpreter") | "agent" |
| Runtime participant in a call | **Interpreter** / "Voice Labs" | "agent", "bot" |
| `latency_mode` | **Translation pace**: Fast / Balanced / Careful | "latency mode" |
| `hear_original` | **Also hear their real voice** | "hear original" |

Reason: the audit found that "Agent" stands for every concept. A separate word for each one is what
makes the IA readable.

---

## 2. Information architecture

### 2.1 Three layers

**A. Communication (primary).** Start a call, invite or join, the live call, the end-of-call
summary. One goal per screen, minimal chrome, no workspace navigation during a call.

**B. Workspace (secondary).** Conversations (history), Agents and interpreters, Voices, Usage,
Settings. Agent-builder tools (Campaigns, Knowledge, Tools) are grouped under **More**.

**C. Technical (tertiary, progressive disclosure).** Provider, model, identities, runtime status,
connection quality numbers, latency, pipeline check, raw events. It is reachable in three places:

- a **"Technical details"** disclosure on the call screen and on conversation detail, closed by default;
- the **Agent test** page (`/agents/[id]/test`), which stays developer-facing by nature;
- agent detail/edit "Providers" sections, collapsed.

Reason: the brief puts technical info "available but secondary". A per-surface disclosure is
simpler than a separate developer app and keeps the existing playground contracts in place.

### 2.2 Sitemap

```
/                              Landing (marketing)                                 [kept, rewritten hero]
/call                          Start a call → live call → call ended               [NEW, layer A]
/join                          Guest entry (credentials in URL #fragment)           [NEW, layer A]

/conversations                 Conversation history (calls + agent tests)           [kept; title "Conversations"]
/conversations/[id]            Conversation detail: transcript, outcome, tech       [kept, re-ordered]

/agents                        Agents & interpreters (filter: All / Interpreters / Agents) [kept, merged view]
/agents/new                    Create agent or interpreter                          [kept, + interpreter mode in P1]
/agents/[id]                   Agent / interpreter detail                           [kept, people-first order]
/agents/[id]/edit              Edit                                                 [kept]
/agents/[id]/test              Agent test (human ↔ AI)                              [kept, re-laid-out, layer C-ish]

/voices, /voices/clone, /voices/design   Voice library                              [kept]
/analytics                     Usage                                                [kept route, label renamed "Usage"]
/campaigns, /campaigns/new, /campaigns/[id]   Outbound (under More)                 [demoted]
/knowledge, /tools             Agent tools (under More)                             [demoted]
/settings                      Settings: appearance, audio, name, technical details [NEW, phase 2]
```

Route decisions:

| Decision | Reason |
| --- | --- |
| **One `/call` route** for setup, live and ended, driven by a client state machine rather than `/call/[id]`. | LiveKit credentials exist only in memory, and there is no endpoint to re-mint a creator token. A shareable or reloadable `/call/[id]` URL would promise a rejoin that cannot work. |
| **`/join` with all guest data in the `#fragment`.** | The fragment is never sent to any server or written to access logs. There is no join endpoint (audit §6.2-1), so the link has to carry the token. |
| **Keep `/conversations`** (not "Calls"). | One history covers both calls and agent tests. The e2e tests assert the heading "Conversations" and the text "No conversations yet.". |
| **Interpreters live inside `/agents`** as a filter. No `/interpreters` route. | They *are* agents in the API (`mode`). A second CRUD surface would duplicate the form and the list. |
| **`/analytics` route kept, label "Usage".** | No test ties the label, and "Usage" is the brief's word. Keeping the route avoids redirects. |
| **Campaigns, Knowledge, Tools moved under "More".** | Outbound SIP and agent tooling are outside the brief's core. They keep working but should not compete with "Call". |
| **No `/languages` or `/providers` page in this round.** | Languages are chosen in the call setup and agent form. The provider API is read-only in the frontend today (`POST /providers` is unused). A page with nothing to act on is dashboard noise. List both as later work. |
| **Separate route group or layout for `/call` and `/join`** (no `DashboardBackground`, no footer, minimal header). | The background canvas animates during calls (audit §5), and a call needs focus and the full viewport on mobile. |

### 2.3 Home

- `/` stays the marketing landing. The brand link points there, and a test asserts this.
- **"Call" is the first nav item, and "Start a call" is the one primary button in the header.**
  Reason: the main task should be one click from every page.

---

## 3. Navigation model

### 3.1 Desktop and laptop (≥ 1024 px)

Single top bar, left to right:

- Brand ("Voice Labs home" → `/`).
- Links: **Call**, **Conversations**, **Agents**, **Voices**, **Usage**, **More ▾** (Campaigns,
  Knowledge, Tools).
- Right side: ⌘K search button, theme switch ("Dark theme"), **Start a call** (primary button,
  hidden while on `/call`).

Rationale: six top-level items fit at 1024 px without scrolling. The audit flagged the 7-link
header that scrolls sideways.

Other rules:

- `aria-current="page"` stays on the current section (tested).
- The command palette (⌘K) gains a "Start a call" action and keeps "New agent", "Talk to {agent}"
  and the page entries (tested).
- A **skip link** ("Skip to content") goes first in the workspace layout (missing today).

### 3.2 Tablet (640–1023 px)

- Brand, **Start a call**, and a **Menu** button.
- Menu opens a native `<dialog>` sheet from the top with the same links, grouped as
  *Communicate* (Call, Conversations), *Build* (Agents, Voices, More items), *Account* (Usage,
  Settings, theme).

Reason: a native `<dialog>` gives focus trapping and Esc for free, with no dependency, the same as
the existing command palette.

### 3.3 Mobile (< 640 px)

- Same as tablet. The brand collapses to its mark, and "Start a call" becomes an icon button with
  the accessible name "Start a call".
- **No bottom tab bar.** Reason: the bottom of the screen belongs to the call control dock, and the
  workspace has too few frequent destinations to justify a permanent tab bar.

### 3.4 In-call navigation (all sizes)

- No workspace nav while a call is live. Only the call header (§5.1) shows.
- Leaving the page while connected triggers a `beforeunload` prompt.
- An in-app link away (e.g. the brand) opens a confirm: "Leave the call? Ending it ends it for
  {other person} too."

Reason: an accidental navigation silently drops a two-person call. See F7 and the lifecycle in §4.4.

---

## 4. User flows

Notation: **→** user action, **⇢** system action, **[E]** error branch, **[L]** loading,
**[∅]** empty.

### 4.1 Start a multilingual call (creator)

1. → "Start a call" (header, landing CTA or ⌘K) → `/call`, **Setup** state.
2. Setup form (one column, no more than 4 primary inputs):
   - **"I speak"**: language select, defaulting to the last used value (localStorage) or the browser
     language when supported.
   - **"They speak"**: language select. A **Swap** button sits between the two selects.
   - **"Your name"** (optional, max 100, remembered locally). It becomes `display_name`, which
     names you in their transcript.
   - **Microphone check**: device select (from `enumerateDevices`) and a live level bar from the
     permission stream. It shows "We hear you" once the level crosses a threshold.
   - **Collapsed "Call options"**:
     - *Translation pace* (Balanced default, Fast, Careful) → `latency_mode`.
     - *Also hear their real voice* → `hear_original`.
     - *My translated voice*: a ready voice from `/voices`, otherwise the "Interpreter's default
       voice" → `voice_profile_id`.
     - *Interpreter* (advanced): pick a specific matching interpreter agent.
3. Language list = the 14 interpreter languages (`validation.py:22-24`). Each is shown as English
   name plus native name ("Korean · 한국어").
   - Reason: the other person may not read English. The native name lets them confirm their language
     on the creator's screen.
   - "They speak" excludes "I speak", because the backend rejects equal languages.
4. → **Start call** (disabled until both languages are set and the mic permission is granted).
5. ⇢ **Resolve interpreter**:
   - `GET /agents`, then find one with `mode:"interpreter"`, engine `cascaded`, the same language set
     and the same pace/hear-original settings.
   - None found → `POST /agents` with:
     - `name:"{A} ↔ {B} interpreter"`;
     - `mode:"interpreter"`;
     - `interpreter:{languages:[mine, theirs], direction: auto-if-both-in-auto-set-else "one_way", engine:"cascaded", latency_mode, hear_original}`.
   - The new interpreter is reused next time. Reason: the API ties language pair and settings to an
     agent (F1–F3), and silent reuse avoids flooding `/agents` with duplicates. *(Open question Q1.)*
6. ⇢ Mic probe → stop the probe tracks (keep the current invariant: probe before session).
7. ⇢ `POST /voice/sessions {agent_id, participant:{language, display_name?, voice_profile_id?}}`.
   Keep `session_id`, `conversation_id` and **`session_token`** in memory.
8. ⇢ Connect to LiveKit, enable the mic, then start the `ensure-running` loop (same backoff as the
   playground).
9. ⇢ The UI shows the **live call** in the *Waiting for the other person* state, with the **Invite**
   panel already open (§4.2).

Branches:

- **[L]** Steps 5–8 show a single progress line that names the human-level step: "Preparing
  interpreter…" → "Connecting audio…" → "Starting interpreter…". The raw phase goes in Technical
  details. Reason: progress builds trust, and jargon does not.
- **[E] Mic denied / not found / insecure context**: inline error on the mic check with a "how to
  allow" hint. No session is created (existing invariant).
- **[E] Platform unreachable**: "Can't reach Voice Labs right now. Try again." The existing
  `describeError` sentence is kept in Technical details.
- **[E] LiveKit not configured (empty token)**: "Calls aren't set up on this server yet." Reason: the
  current "LiveKit is not configured…" text is operator copy shown to end users (audit §5). It moves
  into Technical details.
- **[E] 422 `invalid_interpreter_config` / `participants_require_cascaded_interpreter` /
  `invalid_participant_language`**: "This language pair can't be interpreted with the current
  settings." Offer "Try Balanced pace" if the pace was Fast. The code goes in Technical details.
- **[E] 409 `selected_voice_unavailable`**: "That voice isn't ready. Using the interpreter's
  voice." Offer one-click retry without the voice.
- **[E] 503 `runtime_unavailable` / `runtime_auth_not_configured`**: show the call as "Interpreter
  is starting…", keep the `ensure-running` retries, and after 3 failures show "The interpreter
  isn't responding" with End call / Keep waiting.
- **[∅] No ready voices**: hide "My translated voice". Do not show it disabled.

### 4.2 Add the second participant (creator side)

The Invite panel opens automatically once the creator is connected and the call is waiting.

1. Fields:
   - **Their language**: preset from setup and read-only here.
   - **Their name** (optional): it becomes their `display_name` and personalises the join screen.
2. → **Create invite link**. The button is explicit, not automatic. Reason: generating the link
   uses up the only guest slot (F5) and starts the 10-minute clock (F6). The creator should do it
   when they are ready to send it.
3. ⇢ `POST /voice/sessions/{id}/participants {language, display_name?}`.
   - The response gives `{participant_identity, connection:{url, token}, session_token}`.
4. ⇢ Build the link
   `/join#v=1&s=<session_id>&c=<conversation_id>&u=<livekit_url>&t=<livekit_token>&k=<guest_session_token>&me=<their_lang>&them=<creator_lang>&from=<creator_name>&name=<their_name>&exp=<issued_at+600s>`.
5. Panel shows:
   - The link with **Copy link** and, where `navigator.share` exists, **Share…**.
   - A **10:00 countdown** "Link works for 9:41".
   - One honest sentence: "Anyone with this link can join as {name}. It can be used once and
     expires in 10 minutes."
   - A secondary **Open guest view in a new tab** for testing on one device, with the hint
     "Use headphones to avoid echo".
6. ⇢ The panel collapses to a "Invited · waiting for {name}" chip once a `guest-*` participant
   connects (`ParticipantConnected`).

Branches:

- **[E] 409 `session_full`**: "Someone has already been invited to this call." This also happens
  after a page reload, when the in-memory link is gone. Offer **End call and start a new one**.
- **[E] 409 `session_not_active`**: the call already ended. Show the Ended state.
- **[E] 422 `participant_languages_must_differ`**: should not happen (UI prevents it); show generic copy.
- **Expiry while unused**: at 0:00 → "The invite link expired before {name} joined. Voice Labs
  can't issue a second link for this call." Primary: **End and start a new call**, which preserves
  the language settings.
  - Reason: F5 makes a re-invite impossible, and pretending otherwise would fail.
  - **Future: requires backend**: an invite-code endpoint, or a re-issue/revoke-guest endpoint, plus
    a token TTL longer than 10 minutes for invites.
- **Copy failure** (`navigator.clipboard` blocked): select the text field and say "Press ⌘C / Ctrl+C".

### 4.3 Join as the second participant (guest side, `/join`)

1. ⇢ Parse the fragment, then immediately `history.replaceState` to strip it. Reason: this keeps
   the token out of bookmarks, screenshots of the URL bar, and accidental re-sharing.
2. Join screen:
   - Title: "{from} invited you to a call".
   - The pair, in both languages: "You speak **English** · you'll hear {from} in English" /
     "{from} speaks **Korean · 한국어** · they'll hear you in Korean".
   - Name field (prefilled from `name`, for display only; the server already holds the name given
     by the creator).
   - Mic check (same component as setup).
   - Countdown "Join within 6:12".
   - **Join call** button.
3. → Join ⇢ mic probe → LiveKit connect with the guest token → mic on → poll the conversation with
   the guest `session_token` → live call screen in the guest's perspective.

Branches:

- **[E] Missing or garbled fragment**: "This invite link is incomplete. Ask {from or 'the person
  who invited you'} for a new one." No form.
- **[E] `exp` passed** (local clock) **or LiveKit rejects the token**: "This invite has expired.
  Ask {from} to start a new call." Reason: the guest cannot fix it, so tell them who can.
- **[E] Conversation already ended** (`GET /conversations/{c}` status ended): "This call has ended."
- **[E] Link opened a second time while the guest is already connected elsewhere**: LiveKit
  disconnects the duplicate identity. Show "This invite is in use on another device."
- The same mic/permission/LiveKit errors as §4.1.

### 4.4 In call: lifecycle, leave and end

- **Normal**: both people talk, and each hears the translation. Details in §5.
- **Mute** → `localParticipant.setMicrophoneEnabled(false)`. Muting is local and immediate, and the
  other side sees "Muted" via `TrackMuted`.
- **End call** (both roles): a confirm dialog says "End the call for both of you?" Reason: F7, the
  backend has no "leave without ending".
  - ⇢ Disconnect LiveKit, then `POST /voice/sessions/{id}/end` (with the session's bearer token).
  - Keep the existing "retry end" behaviour: on failure show **Retry end call**, and keep the
    session id.
- **The other person ends**: ⇢ the room disconnects us, or polling sees `conversation.status`
  ended. The UI shows "{name} ended the call" and the Ended state.
- **The other person drops** (`ParticipantDisconnected` without the call ending): "{name} left or
  lost connection". The call stays open, with a hint: "If they don't return, end the call."
  Whether the backend auto-ends a two-person call in this case is not verified (Q4).
- **We drop unexpectedly** (`Disconnected` not initiated by us):
  - **Change from the playground**: do **not** call `end`, because that would end the call for the
    other person (audit §6.2-9).
  - Show "You were disconnected" with **Rejoin** (reconnect with the same token). Rejoin is enabled
    only while `issued_at + 10 min` has not passed; otherwise show "Can't rejoin this call" plus
    **End call**.
  - The playground keeps its current end-on-drop behaviour (tested).
- **Tab close / navigate away**: `beforeunload` prompt. If the person leaves anyway, nothing is
  sent; LiveKit sees the participant disconnect. This matches the playground e2e, which asserts no
  `/end` request on navigation.
- **Ended state** (on `/call`):
  - Summary with duration, the two people and languages, the number of exchanges, and the last 3
    transcript pairs.
  - **Open full transcript** → `/conversations/[id]`.
  - **Start another call** (same languages).

### 4.5 Review a past conversation

1. `/conversations` list. Each row:
   - **Title**: the interpreter or agent name, e.g. "Korean ↔ English interpreter".
   - **Kind badge**: "Call" (interpreter) or "Agent test".
   - Relative start time, duration, outcome, and the channel badge only when it is not `web`.
   - The status is shown as a word with a colour dot ("Live", "Ended", "Failed") instead of the raw
     status string.
   - Reason: a UUID title tells nobody anything (audit §2).
   - Participant names are **Future: requires backend**: they are not on `GET /conversations` or
     on messages.
2. Filters stay (outcome chips) and add a kind filter (All / Calls / Agent tests). "Refresh now"
   is kept.
3. **[L]** skeleton rows. **[∅]** "No conversations yet." (tested text) plus a **Start a call**
   button. **[E]** inline error, never shown as empty (tested).
4. `/conversations/[id]` order: **people → transcript → outcome → technical**.
   - **Header**: pair ("Korean speaker ↔ English speaker"), date, duration, status.
   - **Transcript**:
     - *Calls*: grouped by speaker language. Each original has its translation underneath, with
       the label "Translation matched by order". The heuristic has to be labelled (audit §6.2-2).
     - *Agent tests*: the current chat layout.
     - Both keep `LanguageTags` and the script tint.
   - **Outcome panel**: unchanged.
   - **Technical details** (collapsed): Conversation ID, Agent id, `Voice session: …`, and the
     "Voice session activity" event log.
5. Branches: 404 → "This conversation doesn't exist" and polling stops (tested). Messages failed →
   "Transcript unavailable" (tested). Live conversation → polls every 3 s and shows a "Live" badge.

### 4.6 Test an AI agent (existing playground, `/agents/[id]/test`)

The flow does not change: Start conversation → connected → talk → End conversation →
"Open conversation history". What changes is the layout and attribution:

- **Left/top: "people"**: two participant tiles, **You** and **{agent name}**. They use the same
  Participant component as calls, so the model is the same in both modes.
- **Centre: live transcript**, now above the fold.
- **Right/bottom: Diagnostics column** (Pipeline check, Latency, the Diagnostics lines). It stays
  **expanded by default on this route**. Reason: the e2e asserts `toBeVisible()` on "Conversation
  activity: …", so a closed `<details>` would break it, and this page is the developer surface anyway.
- Remote speaker attribution:
  - only a `kind: agent` participant counts as "the agent";
  - any other remote participant is labelled "Other participant".
  - Reason: this fixes audit finding `page.tsx:283` without changing any tested string.
- All branches stay exactly as they are today (mic errors, retry end, playback blocked alert, and
  end on unexpected disconnect).

---

## 5. The realtime call screen (highest priority)

### 5.1 Layout regions

```
┌──────────────────────────────────────────────────────────────────────────┐
│ CALL HEADER  Korean ↔ English · 04:12 · ●●● Good connection · [Details]   │
├───────────────────────────────────────────────┬──────────────────────────┤
│  PEOPLE                                       │  TRANSCRIPT               │
│ ┌───────────────┐   BRIDGE   ┌───────────────┐│  Ji-woo · 14:02           │
│ │ You (Alex)    │  ───────▶  │ Ji-woo        ││  내일 회의 몇 시예요?     │
│ │ English        │ Translating│ Korean · 한국어││  → "What time is the     │
│ │ hears Korean  │ into Korean│ hears English ││     meeting tomorrow?"    │
│ │ ▁▃▅ Speaking  │            │ ◌ Listening   ││  You · 14:02              │
│ └───────────────┘            └───────────────┘│  At ten.                  │
│  (status line, sr live region)                │  → 열 시요. (heard by J.) │
│                                               │  [Jump to latest]         │
├───────────────────────────────────────────────┴──────────────────────────┤
│ CONTROL DOCK  [Mic] [Output ▾] [Invite] [Transcript] [⋯]       [End call] │
└──────────────────────────────────────────────────────────────────────────┘
```

| Region | Content | Reason |
| --- | --- | --- |
| **Call header** | Language pair as the title, elapsed time (from local connect), overall connection indicator, **Details** toggle (Technical layer). | The pair names the call better than an id; the connection state is always visible because it gates everything else. |
| **People** | Two participant cards, **always You first (left/top)**, then the other person. The **Bridge** sits between them. | Brief priority 1–2 (people, conversation). A stable position means no layout shift when someone joins. |
| **Bridge** | The interpreter, shown as the connection between people rather than a third person. A direction arrow and a short label ("Translating into Korean", "Speaking to Ji-woo in Korean", "Ready"). | The interpreter is infrastructure (brief). Drawing it as a link makes *who hears what* obvious at a glance. |
| **Status line** | One sentence for the current call state ("Waiting for Ji-woo to join", "Reconnecting…"). This is the single `role="status"` region. | It is the text counterpart of the visuals, and the one place screen readers hear state changes (§8). |
| **Transcript** | Finished utterances in pairs, perspective-aware (§5.4). | Brief priority 7. On the side on desktop so it never covers the people. |
| **Control dock** | Mic, Output, Invite (creator, until the guest joins), Transcript (mobile/tablet), More (⋯: devices, call info, shortcuts), **End call** set apart on the right. | Brief priority 8. A destructive action separated from toggles avoids mis-taps. |

### 5.2 Participant representation

Each card shows, in this order:

1. **Name**: `display_name`; if missing, "You" or "Guest". Reason: the server has no accounts (audit
   §6.2-8), so this is all the identity there is.
2. **Language line**: "**Speaks** Korean · 한국어 → **hears** English". The speak language is
   prominent and the hear language secondary. The language names come from the call's own
   contract, which the client knows from setup or the invite fragment.
3. **State**: an icon, a short word ("Speaking", "Listening", "Muted", "Weak connection",
   "Reconnecting", "Joining…", "Left") and a level indicator (§5.3).
4. **Connection quality**: 3-bar mini meter, only when it is not "excellent/good". Reason: show
   it when there is a problem, and keep it quiet otherwise.

Card perspective:

- For **you**, the "hears" language is what *you* hear.
- For **them**, "hears" is what *they* hear, which is your speech translated.

The bridge label always names the direction in human terms: "Translating Ji-woo into English (for
you)" / "Speaking to Ji-woo in Korean".

The interpreter's own connection appears only in the bridge:

| Interpreter state | Bridge label | Signal |
| --- | --- | --- |
| Not connected | "Interpreter starting…" | No `kind: agent` participant present yet; `ensure-running` status. |
| Connected and idle | "Ready" | `kind: agent` participant present, no activity. |
| Disconnected mid-call | "Interpreter reconnecting…" | `ParticipantDisconnected` for the agent; keep `ensure-running` retries. |

### 5.3 State model

Each row gives: the state; the **signal** that triggers it and its **source today**; the intended
visual treatment (Agent 3 sets the exact visuals); and what to do when the signal is missing.
"LK" means `livekit-client` events, all available on the client with no backend change.

State scopes: **call state** is one at a time and drives the status line. **Person state** applies
per card, and both cards can hold one. **Bridge state** belongs to the interpreter.

| State | Scope | Trigger / data source | Visual intent | If the signal is unavailable |
| --- | --- | --- | --- | --- |
| **Connecting** | call | Local phase from `start()` until `room.connect` resolves; LK `ConnectionStateChanged(connecting)`. | Calm progress text in the status line; cards show placeholders; no level meters. | n/a (local). |
| **Waiting for other person** | call | Connected, and `room.remoteParticipants` has no non-agent participant (identity not `voice-labs-agent-*`, `kind ≠ agent`). LK `ParticipantConnected` / `ParticipantDisconnected`. | Other card in a "Not joined yet" outline state with their name and language (known from setup); Invite panel prominent. | n/a. |
| **Listening** | person | Connected, mic enabled, not in `activeSpeakers`. | Resting indicator; "Listening". No motion. | Default state. |
| **Speaking** (you) | person | You are in `ActiveSpeakersChanged`. The level comes from `localParticipant.audioLevel`, or from the existing `AnalyserNode` helper (`voice-input.ts`) on the local mic track for a continuous meter. | Level bars driven by the real level; "Speaking". | Fall back to binary from active speakers (no meter). |
| **Speaking** (other person) | person | The other human is in `ActiveSpeakersChanged` (server-computed). | Same treatment on their card. **No** level meter, because their raw audio is not subscribed (`hear_original` false), so there is no local level. Use `participant.audioLevel` if LK provides it, otherwise a binary pulse. | **Verify** in the first ko↔en test that LK sends speaker updates for participants we are not subscribed to. If it does not, show nothing and let "Translating" (below) carry the signal. |
| **Translating** *(inferred)* | bridge | Either (a) the other or local human was speaking and has stopped, and the interpreter has not started speaking yet, within a 6 s window; or (b) polling shows a newest `user` message in language X with no later `assistant` message in the other language (F8). | Bridge arrow in "working" state; label "Translating into {lang}…"; in the transcript, a pending line under the original. Ends when the interpreter speaks or the translation arrives. | If neither (a) nor (b) holds, **do not show it**. Time out after 6 s with no audio and no message. Copy never claims precision ("Translating…", no percentage). There is no explicit runtime event (**Future: requires backend**: a `TranslationStarted/Finished` event, or a data-channel message). |
| **Speaking translation** | bridge + person | The interpreter (`kind: agent`) is in `activeSpeakers`. **Direction** comes from the listener's own subscribed track: if *our* `translation-for-<my identity>` track has energy (AnalyserNode on the attached track), the label is "You're hearing {other} in {my lang}". If not, the label is "{other} is hearing you in {their lang}". | Arrow points toward the listener; the listener's card shows "Hearing translation"; a subtle level on the bridge from our own track. | Without the analyser (e.g. an unsupported browser), show "Interpreter speaking" with no direction. Never guess the direction from timing alone. |
| **Muted** | person | You: `localParticipant.isMicrophoneEnabled` and LK `TrackMuted`/`TrackUnmuted` on the local publication. Other person: the same events for their mic publication. | Mic-off icon plus "Muted"; the level meter hidden; the dock mic button in the "off" style with its label switched. | Remote mute visibility without a subscription needs **verifying**. If it is not received, show nothing for their mute. |
| **Network degraded** | person + call | LK `ConnectionQualityChanged` → `poor` / `lost` for the local or remote participant. | Header indicator changes; the affected card shows "Weak connection"; status line "Your connection is weak; translation may lag" (local only). | n/a. |
| **Reconnecting** | call | LK `Reconnecting` / `SignalReconnecting` → `Reconnected`. | Status line "Reconnecting…"; meters frozen and dimmed; controls stay enabled. | n/a. |
| **Interpreter starting / unavailable** | bridge | No agent participant; `ensure-running` result (`created`, `not_configured`, `manual_start_required`, error). | Bridge shows "Interpreter starting…"; if unavailable after 3 attempts: "Interpreter isn't responding". | n/a. |
| **Sound blocked** | call | `audio.play()` rejected or LK `AudioPlaybackStatusChanged` with `room.canPlaybackAudio === false`. | Blocking banner "Tap to turn on sound" → `room.startAudio()`. Keep the playground's `role="alert"` pattern. | n/a. |
| **Other person left** | person | `ParticipantDisconnected` for the other human while the call is not ended. | Their card shows "Left the call"; status line explains; End call is emphasised. | n/a. |
| **Ended** | call | We ended (`end` OK), or the room was disconnected by the server, or polling sees the conversation ended. | Transition to the Ended summary. Audio elements removed (existing). | If `end` fails: "Retry end call" (existing pattern). |

Precedence for the status line, highest first:

Ended > Sound blocked > Reconnecting > Connecting > Waiting > Interpreter unavailable > Network
degraded > *(empty: the visuals speak)*.

Reason: one message at a time, and the most blocking one wins.

Performance rules for state:

- Speaker and level updates go to a small store read only by the participant cards and the bridge,
  through `useSyncExternalStore` or refs. They must never call `setState` on the page root. Reason:
  the audit found `setLevels` re-rendering the whole playground.
- Level meters render through CSS custom properties, updated at most once per animation frame,
  and stop when the level is zero.

### 5.4 Transcript and translation presentation

Constraints: finished utterances only, polled every 1.5 s, speaker known by language only (F8,
audit §6.2-2,3).

- **Perspective rule:** in each pair, **the text in the viewer's language is primary**.
  - For an utterance by the other person: their original is shown small/secondary with `lang="ko"`,
    and the translation in my language is primary, labelled "{name} · translated".
  - For my own utterance: my original is primary, and the translation is secondary, labelled "What
    {other} heard".
  - Reason: the reader reads what they understand. The original stays visible for trust and for
    bilingual users.
- **Attribution:**
  - `role:"user"` + `primary_language` = which person (the two languages always differ).
  - `role:"assistant"` + `primary_language` = whose listener got the translation.
  - Names come from the call's known `display_name`s.
- **Pairing:** an `assistant` message pairs with the closest preceding unpaired `user` message
  whose language is the *other* one. Unpaired translations show on their own.
  - In Technical details, show "Pairing: by order (approximate)".
  - **Future: requires backend**: persisting `speaker_user_id`/`source_language`/`target_language`
    on messages, which the Runtime already sends and the Platform drops at ingestion.
- **Pending:** an original without a translation yet shows a quiet "Translating…" line beneath it.
  The line goes away when the pair completes, or after 20 s with no translation (replaced by "No
  translation received").
- **Appearance:** new turns fade in and slide 4–8 px (none under reduced motion). No typewriter
  effect. Reason: a typewriter would fake streaming the API does not have.
- **Scroll:** stick to bottom while the reader is at the bottom. If they scrolled up, show a
  "Jump to latest" pill with the count of new turns. Reason: the transcript must not pull the
  reader away while they reread.
- **Volume:** collapse turns older than the last 50 behind "Show earlier". Use `ScriptText` and
  the Hangul-capable font fallback (handoff to Agent 3: no current font has Hangul/CJK, audit §4).
- **Polling:**
  - Reuse one poll loop per call, keyed on conversation id only. The current loop restarts on every
    phase change (audit §1.6); do not copy that.
  - Diff by message id so React adds rows instead of re-rendering the whole list.
- **Guest polling** sends `Authorization: Bearer <guest session_token>`. It must work against an
  auth-enabled Platform (F7).

### 5.5 Controls

| Control | Now / Future | Behaviour |
| --- | --- | --- |
| **Mic on/off** | **Now** | `setMicrophoneEnabled`. Button label changes "Mute" ↔ "Unmute", with `aria-pressed`. Shortcut **M**. |
| **Input device** | **Now** | In More/Settings sheet: `room.switchActiveDevice('audioinput', id)`, list from `Room.getLocalDevices('audioinput')`. |
| **Output / speaker device** | **Now (where supported)** | `switchActiveDevice('audiooutput')` / `setSinkId`. Hidden where unsupported (Safari/iOS). Do not disable it. |
| **Output volume** | **Now** | Per-element volume on our translation audio element(s); local only. |
| **End call** | **Now** | Confirm → disconnect → `end` (ends for both, F7). |
| **Invite** | **Now (once per call)** | §4.2. Hidden for the guest and after the guest joins. |
| **Transcript toggle** | **Now** | Mobile/tablet sheet; on desktop, collapse the side panel. |
| **Technical details** | **Now** | Drawer: identities, room, session/conversation ids, runtime status, LK connection quality values, interpreter config (engine, pace, direction, hear_original), pairing note, and latency once fixed (P1, see §10). |
| **Language** | **Read-only in call** | Shown on the cards. Changing it means ending the call and starting a new one. **Future: requires backend**: a mid-call participant language update endpoint (only `POST …/participants` "add" exists). |
| **Translation pace / hear real voice** | **Before the call only** | Set in setup "Call options". Shown read-only in Details. **Future: requires backend** for mid-call change (the interpreter is fixed at session creation). |
| **Leave (without ending)** | **Future: requires backend** | No endpoint (audit §6.2-9). Do not show the button. |
| **Invite by reusable link / lobby** | **Future: requires backend** | Invite-code endpoint, guest re-issue, longer TTL. |
| **Add an AI agent to the call / phone participant** | **Future: requires backend** | Interpreter and agent modes are exclusive; SIP dialing is gated. Do not show the buttons. |
| **Provider switch in call** | **Future: requires backend** | Providers are fixed per agent at session creation. |

Rule: Future items are **not rendered as disabled buttons** in the call dock. They can appear in a
"Coming later" list in Technical details or docs. Reason: disabled controls in the main dock look
broken and add noise. This is the opposite of the current scattered "Coming soon" labels.

---

## 6. Screen inventory

| Screen | Route | Purpose | Key content (in priority order) | Layer |
| --- | --- | --- | --- | --- |
| Landing | `/` | Explain the product in 5 s; start a call | Headline/sub (§1.1), real-UI illustration, "Start a call", "Build a voice agent", how it works (3 steps: pick languages → share link → talk), languages list, agents section (secondary), footer | Marketing |
| Call setup | `/call` (setup) | Choose languages, check mic, start | I speak / They speak + swap, your name, mic check, Call options (collapsed), Start call | A |
| Live call (creator) | `/call` (live) | Talk across languages | §5 regions; Invite panel until the guest joins | A |
| Live call (guest) | `/join` (live) | Same as creator, guest perspective | §5 regions; no Invite | A |
| Guest join | `/join` (pre-join) | Understand the invite, check mic, join | Inviter, both languages (native names), countdown, mic check, Join call; invalid/expired states | A |
| Call ended | `/call` or `/join` (ended) | Close the loop | Duration, people + languages, last pairs, Open full transcript (creator; guest too since its token allows reading), Start another call (creator only) | A |
| Conversations | `/conversations` | Find past calls and tests | Kind filter, outcome chips, rows (§4.5), Refresh now, empty → Start a call | B |
| Conversation detail | `/conversations/[id]` | Read what was said; record the outcome | Header pair, transcript (paired for calls), outcome panel, Technical details (ids, `Voice session: …`, event log) | B |
| Agents & interpreters | `/agents` | Manage AI agents and saved interpreters | Filter All/Interpreters/Agents, search (`/`), cards showing **name, kind, languages, status, last used**; provider dots move to Technical details on the card hover/expander. Stats row reduced to one line or removed (it duplicates the list) | B |
| Agent / interpreter form | `/agents/new`, `/[id]/edit` | Create/edit | Template picker (agents), Basics, Languages & voice, **Mode** (P1: Agent / Interpreter with pair, pace, hear original), Providers (collapsed "Advanced") | B/C |
| Agent detail | `/agents/[id]` | Overview of one agent | Hero (name heading, kind, languages, **Start a call with this interpreter** or **Talk to this agent**, Edit agent), recent conversations (via `?agent_id=`), then deployments/tools/knowledge, then Configuration (collapsed) | B |
| Agent test | `/agents/[id]/test` | Check an AI agent end-to-end | §4.6 layout; all tested strings kept | C |
| Voices | `/voices`, `/clone`, `/design` | Voice library and creation | Unchanged structure; consent flows kept; preview stays flagged unless verified (§10) | B |
| Usage | `/analytics` | Volume and quality over time | Totals, by outcome/channel/**language**, latency (after the key fix) | B |
| Campaigns, Knowledge, Tools | existing | Agent builder / outbound | Unchanged; reached via More | B (demoted) |
| Settings | `/settings` (phase 2) | Personal defaults | Name, default language, default devices, theme, "Show technical details by default" | B |
| Not found | `not-found` | Recover | Message + links to Start a call / Conversations | — |

---

## 7. Responsive strategy

Breakpoints:

| Name | Width | Notes |
| --- | --- | --- |
| **XL** | ≥ 1280 px | |
| **L** | 1024–1279 px | |
| **M** | 640–1023 px | |
| **S** | < 640 px | Also check short landscape phones (height < 500 px). |

### 7.1 Call screen per breakpoint

| | XL | L | M (tablet) | S (phone) |
| --- | --- | --- | --- | --- |
| **People** | Two cards side by side with the bridge between, centred in the left column | Same, cards compact (no connection meter unless degraded) | Two cards in one row at the top; bridge collapses to an arrow plus label between them | **Conversation strip**: two compact rows ("You · English · Speaking" / "Ji-woo · 한국어 · Listening"), the bridge as one line under them ("→ Translating into Korean"). Each row is about 56 px tall. |
| **Transcript** | Right column, 360–420 px, full height | Right column, 320 px | Below the people, fills the rest; dock is sticky | **The main content** under the strip. It scrolls between the strip and the dock. Reason: on a phone, reading what was said is the main task while listening, and the people strip already carries the state. |
| **Dock** | Bottom bar, labels visible | Bottom bar, labels visible | Bottom bar, icons + short labels | Fixed bottom, `env(safe-area-inset-bottom)`, **3 slots**: More (⋯) · **Mic (large, centre)** · **End** (red). Output/devices/Details/Invite live in the More sheet. Reason: thumb reach, and the two critical actions stay big and apart. |
| **Invite** | Inline panel in the people column | Inline panel | Inline card above the transcript | Bottom sheet that opens on join; "Share…" first (native share sheet), then Copy |
| **Technical details** | Right-side drawer over the transcript | Drawer | Full-height sheet | Full-screen sheet with a close button at the top |
| **Settings/devices** | Popover from the dock | Popover | Sheet | Bottom sheet |
| **Header** | Pair · timer · connection · Details | Same | Same, timer can drop | Pair + connection dot only; timer moves into the More sheet |

Mobile extras (progressive enhancement, no dependencies):

- `navigator.wakeLock.request('screen')` during a live call, released on end.
- Respect the iOS audio unlock: show "Tap to turn on sound" (§5.3) when needed.
- `100dvh` layout so the browser chrome does not hide the dock.
- Touch targets ≥ 44×44 px. Mic ≥ 64 px.

### 7.2 Other screens

- **Setup/Join** are a single column at all sizes, max width ~520 px. On S the Start/Join button is
  sticky at the bottom.
- **Conversations**: rows become two-line cards on S. Filters become a horizontally scrollable chip
  row, which is acceptable for chips but not for primary nav.
- **Conversation detail**: on S the transcript comes first, then outcome, then Technical details.
- **Agent form**: the preview column drops below the form under 960 px (already handled; verify
  visually).
- **Agent test**: on S the order is participants → controls (sticky) → transcript → diagnostics.

---

## 8. Accessibility requirements

1. **Landmarks and structure**:
   - The workspace gets a skip link. `/call` has `<main>` with the h1 = language pair (visually
     shown in the header).
   - People is a `<section aria-label="Participants">`, the transcript is
     `<section aria-label="Transcript">`, and the dock is a `<div role="toolbar" aria-label="Call controls">`.
2. **One status region per page.** The status line (§5.1) is the only `role="status"`
   (`aria-live="polite"`). It announces only **call-level changes**:
   - joined, left, muted/unmuted (self), reconnecting, reconnected, weak connection (self),
     interpreter unavailable, sound blocked, ended.
   - It **never** announces speaking/listening flips. Reason: they change several times a second.
     This is the chatter problem the audit found in the playground.
   - Debounce: the same message is not re-announced within 5 s.
3. **Transcript live region**:
   - The transcript list is `role="log"` with `aria-live="polite"` and `aria-relevant="additions"`.
   - It announces **only completed lines in the viewer's language that came from the other
     person**, e.g. "Ji-woo: What time is the meeting tomorrow?". It does not announce pending lines
     or my own lines.
   - A toggle "Announce new translations" (on by default) sits in the More sheet.
   - Each line has `lang` set to its language so screen readers switch voice and pronunciation.
4. **Participant cards** expose their state as text (visually present or sr-only), e.g. "Ji-woo,
   speaks Korean, hears English, listening". Card state is not live; screen-reader users get state
   on demand from the cards and change announcements from the status line.
5. **Keyboard**:
   - All controls are native buttons or selects, in visual order.
   - Shortcuts work only on the call screen and only when focus is not in a text field: **M** mute,
     **T** transcript panel, **D** technical details, **Esc** closes the open sheet. They are listed
     in More → "Keyboard shortcuts".
   - There is **no** single-key shortcut for End. Reason: it is destructive.
6. **Focus management**:
   - On Start/Join success, focus moves to the call h1.
   - The invite panel's Copy button gets focus when the panel is created.
   - Dialogs and sheets are native `<dialog>`; focus returns to the trigger on close.
   - On Ended, focus moves to the summary heading.
   - The End confirm focuses **Cancel** by default.
7. **Visible focus** everywhere. Remove the box-shadow-only focus overrides the audit lists
   (`dashboard.css:59,189,300`), or add an outline to them.
8. **Not colour alone.** Every state has an icon and a word. Speaking vs listening must not differ
   only by hue. All state colours must pass 4.5:1 for text and 3:1 for UI against both themes
   (handoff to Agent 3: lime-on-dark "agent speaking" is unverified).
9. **Reduced motion** (`prefers-reduced-motion: reduce`):
   - level bars become a static 3-step indicator that changes only on state change;
   - no pulses, ripples, spinning arcs (including the `stage-arc` and `pipe-list` spinners the
     audit found uncovered) or transcript slide;
   - the bridge arrow shows direction statically;
   - the background canvas is off.
   - Motion must always **mean** state: nothing animates while idle.
10. **Errors**:
    - Blocking errors (mic denied, sound blocked, start failed) use `role="alert"`, are tied to the
      control they concern, and say what to do next.
    - Form errors are linked with `aria-describedby`.
11. **Language selects** show the native name. The option text includes both names so typeahead
    works in either language.
12. **Timers** (invite countdown) are not live regions. They announce only at 1 minute left and at
    expiry, through the status line.

---

## 9. Preservation list (must keep working, or update together with the named test)

From the audit §7 and the test files:

**Agent test / playground** (`__tests__/voice-playground.test.tsx`, `e2e/voice-session.spec.ts`):

- Buttons: "Start conversation", "End conversation", "Retry end session".
- Exactly **one** `role="status"` on the page, containing "Connected to LiveKit; microphone is on."
  and later "Session ended and saved." The new call screen uses its own wording, but the playground
  keeps these strings.
- Visible text lines: "Runtime handoff: …", "Microphone activity: Speech detected|No speech
  detected", "AI speaking: Yes|No", "Conversation activity: <label>" for the 5 mapped events. They
  stay **visible** (not in a closed disclosure) on `/agents/[id]/test`.
- Link "Open conversation history". `role="alert"` for blocked playback.
- `audio[data-voice-labs-audio]` elements appended and playing. The call screen must use the same
  attribute, so cleanup and e2e checks keep working.
- Transcript text visible on the page.
- Lifecycle invariants:
  - probe before session; mic error → no session;
  - no double disconnect/end on unmount races; a late session after unmount is ended;
  - an unexpected disconnect ends the session (**playground only**; call mode deliberately differs,
    §4.4, and needs its own tests);
  - navigation away sends no `/end`.

**Pipeline**: `PipelineCheck` "proven only by real results" and "no transcript text inside the
pipeline" (`playground-pipeline.test.tsx`).

**Agent form** (`agent-form.test.tsx`, `e2e/agent-management.spec.ts`):

- Heading "Create an agent" / "Edit agent".
- Labels "Agent name", "Description", "System prompt", "Speech-to-text provider", "Language model
  provider", "Text-to-speech provider".
- Checkbox "Russian". If the language list grows to 14, "Russian" must remain a checkbox with that
  accessible name.
- Buttons "Create agent" / "Save changes".
- Provider ids sent only when changed. Unsupported providers stay disabled options.
- Agent detail: heading = agent name; link "Edit agent"; text "Languages: en".

**Navigation** (`dashboard-header.test.tsx`, `command-palette.test.tsx`):

- Link "Voice Labs home" → `/`; links named "Agents" and "Conversations" with `aria-current`; no
  "Public site" text; switch "Dark theme".
- Palette combobox "Search agents and pages"; items "New agent", "Talk to {agent}", "Conversations";
  "Nothing matches"; "Agents unavailable: …".

**Conversations**:

- Heading "Conversations"; "No conversations yet."; failed request not shown as empty.
- Detail: heading "Conversation"; text `user · ru: …` and "Detected: ru, en" for agent-mode
  conversations (they can sit in a lighter meta style but must stay visible text); `Voice session: …`
  and event labels (tests read them; they may live in Technical details only if that section is
  open by default or the tests are updated in the same change); 404 stops polling; "Transcript
  unavailable"; stale-response guards.

**Landing**: one h1; valid in-page anchors; sequenced sections (`landing-*.test.tsx`); skip link;
reduced-motion handling.

**Theme**: `data-vl-theme` set before paint, persisted under `vl-theme`.

**Platform client**: `request()` keeps HTTP status on errors and parses FastAPI validation lists.
Adding an optional bearer header must not change those behaviours.

Rule: if Agent 4 has to change a tested string, it changes the test in the same edit and lists the
change in its report. No silent selector drift.

---

## 10. Implementation scope recommendation for Agent 4

Constraints (AGENTS.md):

- No design-system library, billing, tenancy or workflow editor. The client only calls Platform and
  joins LiveKit.
- Read `node_modules/next/dist/docs/` before writing route or layout code (Next 16).
- Run install, typecheck, test and build.
- No commits.

### Phase 1, this round (in order)

**P0: foundation (no visible change, unblocks everything)**

1. `lib/platform.ts`:
   - `Agent` gains `mode`, `interpreter`.
   - `createVoiceSession(agentId, participant?)` returns and keeps `session_token`.
   - New `addSessionParticipant(sessionId, {language, display_name?}, token?)` and
     `getVoiceSession`.
   - `request()` accepts an optional bearer token for session-scoped routes.
   - Unit tests for all of the above.
2. `lib/languages.ts`:
   - The 14 interpreter languages with English and native names, plus the auto-direction set.
   - A helper for `direction`.
   - **Keep** the agent form's EN/RU options untouched in P0.
3. `lib/platform-errors.ts`: copy for the new codes in §4.1–4.2.
4. A call-room hook, separate from the playground. Suggested name `useCallRoom`, under
   `components/features/call/` or `lib/`. It:
   - handles LiveKit connect, mic, `audio[data-voice-labs-audio]` attach/cleanup;
   - classifies participants (self / other human / interpreter);
   - follows active speakers, mute, connection quality, reconnecting, playback status and device
     switching;
   - does **no end-on-unexpected-disconnect**;
   - feeds a small external store for levels.
   - Reason: the playground lifecycle has 15 race tests and different end semantics. Refactoring it
     into a shared hook this round risks regressions for no user benefit.
5. A message poll hook keyed on conversation id, with id diffing and the pairing heuristic. Pairing
   gets unit tests.

**P1: the communication experience (the core of the redesign)**

6. `/call`: setup → resolve/create interpreter (F1–F3) → live → ended.
7. Invite panel + `/join` (fragment parse + strip, expiry, invalid states, guest perspective).
8. Call screen components: CallHeader, ParticipantCard, Bridge, StatusLine, Transcript (+ pending,
   jump-to-latest), ControlDock, More sheet (devices, output, shortcuts, announce toggle), Technical
   details drawer, End confirm.
   - Plain React + hand-written CSS using Agent 3's tokens.
9. Call layout with no `DashboardBackground`, and responsive per §7.1.
10. Header nav per §3 (Call first, Start a call button, More menu, mobile menu `<dialog>`, skip
    link); palette "Start a call" action.
11. Landing hero rewrite per §1.1 (copy, CTA to `/call`, static illustration). Remove the
    pinned/scrubbed showcase from the hero area only if the landing tests stay green.

**P2: same round if time allows, otherwise next**

12. Agent test re-layout per §4.6 (participants + transcript first; diagnostics column visible;
    `kind: agent` attribution).
13. Conversations list/detail per §4.5 (kind badge, status words, paired call transcript,
    Technical details ordering; tested strings kept).
14. Fix the latency key mapping (`stt_ttfb` etc.) on `/analytics` ("Usage") and flip the stale
    `liveLatency` note. The live-call latency panel stays off because `runtime-state` filters out
    `LatencyMeasured` (**Future: requires backend**).

### Later (not this round)

- Interpreter mode in the agent form, with 14 languages. It touches heavily tested form code; the
  `/call` flow creates interpreters without it.
- `/settings`.
- Provider list page.
- Voice preview flag flip (endpoint exists; verify Runtime support first).
- Reducing the landing motion libraries (anime.js/Lenis removal).
- Pinning `livekit-client`.
- Agents list card simplification.

### Explicitly out of scope (requires backend)

Invite codes / reusable links / lobby; guest re-issue; live or partial transcripts; explicit
translating events; persisted speaker identity and translation pairing; mid-call language, pace or
provider change; leave-without-end; AI agent joining a human call; phone participants; user accounts.

### Verification Agent 4 should run (in addition to the existing suites)

- Unit tests for: the participant classifier; the state precedence function; the pairing
  heuristic; fragment parse/strip/expiry; the interpreter resolve/create payload (`engine:"cascaded"`,
  `direction` for ko).
- One manual two-tab ko↔en call (headphones). Confirm F3, the visibility of remote active speakers
  and mute without a subscription, and that each tab hears only its translation.

---

## 11. Open questions for the product owner

1. **Auto-create interpreters?** Is it acceptable for "Start a call" to create and reuse an
   interpreter agent per language pair and settings (it will show up in `/agents`)? The alternative
   is to require an admin to configure interpreters first.
2. **Invite link security.** The link carries a live LiveKit token and a guest session token, so
   anyone holding it within 10 minutes can join, once. Is that acceptable for this phase, or should
   invites wait for a backend invite-code endpoint?
3. **"End" ends for both.** Without leave-without-end, either person's End stops the call for both.
   Is that acceptable, or should the guest's button be hidden so only the creator can end?
4. **Drop behaviour.** When one person disconnects, does the backend end a two-person session
   (`SessionEnded reason: participant_disconnected` is seen in agent mode)? What should the product
   do: keep the call open, or end it after a grace period?
5. **UI language for the guest.** The UI is English-only. A Korean-speaking guest will see an
   English join screen (language names are native, everything else is not). Is a localised join
   screen needed for launch?
6. **Names in history.** Display names are not stored on conversations or messages. Should the
   backend persist them (and speaker ids) so history can say "Ji-woo" instead of "Korean speaker"?
7. **Which modes stay in primary nav?** Should Campaigns/Knowledge/Tools go under More as proposed,
   or are outbound campaigns a near-term priority?
8. **Default translation pace** for calls: Balanced (proposed) or Fast?
9. **"Also hear their real voice"**: offer it in setup (proposed, off by default), or hide it until
   tested for echo and overlap?
10. **Auth.** The frontend sends no API key today. Is the target deployment auth-disabled? If not,
    where should the creator's API key come from (admin tokens are not for end users)?
