# Workspace UI notes (agents, playground)

## Agents page
- Server component fetches agents and, best-effort, conversations (`lib/agent-view.ts` builds the cards).
  If conversations fail the page still renders. "Live" means status is one of `active|ready|enabled|published|live`.
- `AgentBrowser` (client): search (matches name, description, status, language codes and names), status chips,
  sort, `/` to focus search. `CommandPalette` (⌘K / Ctrl+K, native `<dialog>`) lists pages and, per agent,
  Talk / Open / Edit.
- Every sub-page has an explicit parent link (`.dash-back`): new → agents, edit → agent, playground → agent,
  conversation → conversations and its agent.

## Voice Playground
- `VoiceStage` is driven by real state only: LiveKit speaker flags and audio levels, then the persisted
  activity label. "Preview animation" runs a simulated loop and is always badged as simulated; it never calls
  the platform and stops when a real session starts.
- `PipelineCheck` marks a step working only after a real result:
  transcript from the user -> speech provider answered; agent message -> language model answered;
  agent audio reached the browser -> voice provider answered. It deliberately shows no transcript text
  (the transcript list is the only place for that, and tests/e2e rely on that uniqueness).
- Constraints to keep: exactly one `role="status"` element on the page, and no `role="alert"` besides the
  audio-playback error.

## Conversations
- List: cards with the agent's orb, agent name (best-effort lookup; falls back to the short id), relative start
  time and duration. Detail: details panel, event timeline, and a chat-style transcript. The text structure
  of the detail page (`Voice session: …`, event labels, `user · ru: …`) is relied on by unit and e2e tests.
- `ScriptText` tints Cyrillic vs Latin runs, and only when a single message actually mixes both scripts.
  It is a script heuristic, not language detection; the `Detected:` line still comes from the platform.

## Agent form
- Live preview (orb colour follows the typed name until the agent has an id), prompt starting points
  (append when the prompt already has text), provider cards, and a `beforeunload` guard while dirty.
  Native `<select>`/checkbox controls and every label are unchanged because tests and e2e query them.

## Theme
- One switch for the whole product: `<html data-vl-theme>` is set by a script in the root layout `<head>`.
  Marketing dark styles are scoped to `.marketing-root` (`app/(marketing)/theme-dark.css`), workspace dark
  styles to `.dash-root` (`app/(dashboard)/dashboard-dark.css`), shared bits in `app/theme-shared.css`.
- Tip when adding workspace UI: use `var(--surface)`, `var(--line)`, `var(--ink)` where possible; they flip
  automatically. Hardcoded colours need an override in `dashboard-dark.css`.

## Network background
- `components/features/dashboard/network-background.tsx`: a fixed canvas (2D API, no library) of sparse nodes and
  faint lines behind the workspace. Modes: `idle` (nodes breathe), `active` (+ slow waves, cursor connections),
  `signal` (+ coral signals hop along the lines to an agent node that answers with a pulse). `modeForPath`
  picks it: `signal` on `/agents`, `idle` on a live playground session, `active` elsewhere.
- The content column is dimmed so work stays readable; colours come from `--ink` / `--accent`, so both themes
  work (re-read when `data-vl-theme` changes). It draws one still frame under `prefers-reduced-motion` and below
  900px, pauses in a hidden tab, ignores touch, and is `aria-hidden` / `pointer-events: none`.
- Ported from the red team portal's `NetworkBackground` idea (read-only reference, nothing there was changed):
  the red "attack" is now a calm voice-signal mode, and the dimmed side became the content column.

## Landing orb microphone
- "Speak to it" is opt-in and hidden under `prefers-reduced-motion` or without `getUserMedia`. The stream feeds
  an `AnalyserNode` only: nothing is recorded, stored or sent, and it stops on toggle or unmount.

## Share image, favicon, 404
- `app/opengraph-image.png` / `twitter-image.png` are static renders (regenerate if the brand changes);
  `app/icon.svg` is the favicon. Set `NEXT_PUBLIC_SITE_URL` in production so share URLs are absolute.
