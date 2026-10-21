# Accessibility audit: phase 1 call experience and navigation

**Auditor**: Agent 5b, Accessibility Auditor
**Date**: 2026-10-21
**Standard**: WCAG 2.2, Level AA. Spec requirements from `VOICE_LABS_UX_SPEC.md` §8 are noted where they go further than WCAG.

**Scope**
- `app/(call)/`: `/call`, `/join`, and `/call/fixture` (live, waiting, translating, reconnecting, ended).
- `components/features/call/*` and `app/tokens.css`.
- Navigation: `dashboard-header.tsx`, `navigation.css`, `command-palette.tsx`, `mobile-navigation.tsx`.
- Landing hero: `hero-call-illustration.tsx` and `landing-page.tsx`.

**Method**
- Code review of every file in scope.
- Contrast ratios computed from the hex values in `tokens.css`, using the WCAG 2.x relative-luminance formula, including opacity compositing.
- Playwright keyboard walkthroughs in Chromium 1243 against the running dev server:
  - viewports 1280×900, 390×844 (touch) and 320×256 (reflow);
  - light theme, dark theme, and `reducedMotion: "reduce"`;
  - a fake microphone (`--use-fake-device-for-media-stream`).
- axe-core is not installed and was not added. No screen reader was run, so the screen-reader results below are inferred from markup and ARIA semantics. A VoiceOver/NVDA pass on a real call is still needed. No live call ran because Platform, Runtime and LiveKit were down, so the live-state checks use the fixture.

## Summary

| Severity | Count |
| --- | --- |
| Critical | 0 |
| Serious | 6 |
| Moderate | 10 |
| Minor | 11 |

The foundations are good. Native `<dialog>` gives a working focus trap, Esc and focus restore (verified). The End confirm focuses Cancel. Focus moves to the call h1 on connect. Every focusable on the call routes gets a 2 px outline, and reduced motion is handled.

The main gaps are:
- **Focus lost when controls unmount.** "Check microphone" and "Start call" both drop focus to `<body>`.
- **Missing announcements.** Mute, "other person joined" and "reconnected" are never announced.
- **Global single-key shortcuts** that cannot be turned off.
- **An invisible skip link** on the call routes.
- **A sticky bar that hides the focused field** on phones.
- **Faded text that fails contrast** in the reconnecting and joining states (light theme).

---

## Serious

### S1. Focus is lost to `<body>` when "Check microphone" or "Start call" is pressed
- **WCAG**: 2.4.3 Focus Order (A). Also UX spec §8.6.
- **Location**:
  - `components/features/call/mic-check.tsx:101-105`: the button exists only while `status === "idle"`.
  - `components/features/call/call-experience.tsx:332-338`: the submit button is replaced by `<LoadingState>` while starting.
- **Evidence (Playwright, `/call`)**:
  - After Enter on "Check microphone", focus was `BODY`.
  - "focus before start: BUTTON Start call" → "focus during start: BODY" → "focus after start result: BODY".
  - After the error the button is back, but focus is not.
  - A keyboard or screen-reader user is sent back to the top of the page at the two most important steps, and has to find the result (device select, error) by hand.
- **Fix**:
  - Keep a stable element in place. Render the Start button all the time, with `aria-disabled="true"` and `aria-describedby` pointing at the loading label while starting. Do not swap it out.
  - After the mic check resolves, move focus on purpose:
    - ready: focus the "Input" select, or the "We hear you" line with `tabIndex={-1}`;
    - error: focus the "Try again" button.
  - After a start error, focus the error title (`tabIndex={-1}`) or the retry action.

### S2. The skip link on `/call` and `/join` has invisible text
- **WCAG**: 1.4.3 Contrast (Minimum), 2.4.7 Focus Visible, 2.4.1 Bypass Blocks.
- **Location**: `app/(call)/call.css:14`. `.call-root a { color: inherit; }` has specificity (0,1,1), so it beats `.skip-link` (0,1,0) in `app/globals.css:29`.
- **Evidence**: computed style of the focused skip link:
  - light: `color=rgb(29,32,34) bg=rgb(29,32,34)`, 1:1;
  - dark: `color=rgb(236,235,228) bg=rgb(236,235,228)`, 1:1;
  - the workspace skip link is correct: `color=rgb(18,21,22) bg=rgb(236,235,228)`.
- **Fix**: add `.call-root .skip-link { color: var(--on-primary); }`, or scope the anchor reset as `.call-root a:not(.skip-link)`.

### S3. Single-character shortcuts M, T and D are global and cannot be turned off
- **WCAG**: 2.1.4 Character Key Shortcuts (A).
- **Location**: `components/features/call/call-screen.tsx:126-137`. The listener is on `window` and fires whenever focus is not in a text field.
- **Evidence**:
  - With focus on `<body>`, pressing `t` changed `data-transcript` from `open` to `closed`.
  - `m` mutes the mic the same way.
  - Speech-input users, and anyone who types into the page by accident, can mute themselves mid-call without noticing.
  - The only reference is a shortcut list in the More sheet. There is no way to turn the shortcuts off or remap them.
- **Fix**:
  - Add a "Single-key shortcuts" checkbox in the More sheet, on by default, stored in localStorage. Skip the handler when it is off.
  - Alternatively, require a modifier (e.g. `Alt+M`), or scope the keys to focus inside the call toolbar.
  - Keep `aria-keyshortcuts` in sync with the setting.

### S4. The status line never announces mute or unmute, "joined" or "reconnected"
- **WCAG**: 4.1.3 Status Messages (AA). Also UX spec §8.2, which lists "joined, left, muted/unmuted (self), reconnecting, reconnected".
- **Location**: `lib/call-state.ts:266-291` (`statusLine`).
  - There is no branch for `state.self.muted`.
  - When the other person joins, the message goes from "Waiting for Ji-woo to join." to `""`.
  - After a reconnect it goes from "Reconnecting…" to `""`.
  - An empty string is never announced.
- **Evidence**:
  - In code, nothing announces mute. When the user presses **M** with focus elsewhere, the only change is `aria-pressed` on a button they are not on.
  - A blind creator waiting on the invite is never told the guest arrived. The card's `aria-label` changes, but it is not live.
- **Fix**: keep the precedence, but announce *transitions*. In `StatusLine` or a small hook, compare the previous and next state and emit one-off messages:
  - "Ji-woo joined the call."
  - "Reconnected."
  - "You're muted." / "Microphone on."
  - Clear each message after about 5 s.
  - Self mute must be announced even when the Mute button has focus. A short status message is still worth it, because the label and the pressed state are ambiguous (see M4).

### S5. The sticky "Start call" bar fully hides the focused "Your name" field on phones
- **WCAG**: 2.4.11 Focus Not Obscured (Minimum) (AA).
- **Location**: `app/(call)/call.css:314` (`.call-submit { position: sticky; bottom: 0; … }` below 640 px).
- **Evidence (390×640, Tab walk)**: tab 8, `INPUT` (Your name): `top 535, bottom 581`; sticky bar `top 483`, so `obscured: true` and `scrollY: 0`. The browser does not scroll it into view, because the element is "in the viewport" behind the bar.
- **Fix**: add `scroll-padding-bottom` equal to the bar height on the scrolling root, e.g. `html:has(.call-submit) { scroll-padding-bottom: 140px; }`. Or add `scroll-margin-bottom` on the form fields inside `.call-form`.

### S6. Faded text in the reconnecting and joining states fails contrast (light theme)
- **WCAG**: 1.4.3 Contrast (Minimum) (AA).
- **Location**:
  - `app/(call)/call.css:147`: `.participant-card[data-state="reconnecting"] { opacity: .6 }`;
  - `call.css:137`: the avatar;
  - `call.css:149`: the joining name and language at `.6`.
- **Evidence**, computed with the alpha composite over `--bg`/`--surface`:

| Text | Light | Dark |
| --- | --- | --- |
| Reconnecting card: other name (`--id-other`) | **2.84** | 3.33 (fails) |
| Reconnecting card: "Reconnecting…" word (`--warning`) | **2.73** | 4.06 (fails) |
| Reconnecting card: "hears …" (`--text-2`) | **2.72** | 3.64 (fails) |
| Joining: self name (`--id-self` at .6) | **2.66** | n/a |
| Joining: other name | **2.81** | n/a |
| Joining: language text (`--text` at .6) | **4.34** | 5.86 |

  These are states, not disabled controls, so no exception applies. The state word itself is unreadable for low-vision users at the moment it matters most.
- **Fix**:
  - Do not fade text. Show "inactive" with a dashed border-top (already in use for waiting), the warning badge, and a `--surface-2` background.
  - If a dimming effect is wanted, apply `opacity` only to the avatar and the meter, which are decorative (`aria-hidden`), and keep the text at full strength.

---

## Moderate

### M1. English language names are tagged with the *other* language's `lang`
- **WCAG**: 3.1.2 Language of Parts (AA).
- **Location**:
  - `participant-card.tsx:62` (`Speaks <b lang={speaks}>{languageName(speaks)}</b>`, i.e. "Korean" with `lang="ko"`);
  - `participant-card.tsx:65` and `language-select.tsx:36` (`<span lang={language}>{languageLabel(language)}</span>`, i.e. "Korean · 한국어" all with `lang="ko"`);
  - `join-experience.tsx:174-179`;
  - `call-ended.tsx:52-53`;
  - `call-experience.tsx:289`.
- **Evidence**: the Playwright `lang` dump showed `lang=ko "Korean"` and `lang=ko "Korean · 한국어"`. A screen reader switches to its Korean voice and reads the English word "Korean" with Korean phonetics.
- **Correct usage, kept as is**:
  - the call h1 (`nativeLanguageName` with `lang`);
  - transcript lines (`primary_language`);
  - the announcement log.
- **Fix**: tag only the native part. Add a `LanguageName` component that renders `{english} · <span lang={id}>{native}</span>`, and leave English names in the page language. Do not put `lang` on `languageName()` output.

### M2. Status regions that mount already filled are usually not announced
- **WCAG**: 4.1.3 Status Messages (AA).
- **Location**: `components/features/call/status-indicator.tsx:14`. `useState(status.message)` renders the message in the first paint.
- **Evidence**:
  - `CallScreen` mounts while `phase === "connecting"`, so its `role="status"` is born with "Connecting to the call…".
  - The waiting state is born with "Waiting for Ji-woo to join."
  - `CallEnded` is born with "Ji-woo ended the call."
  - Live regions announce *changes*. Content present at insertion is not reliably read (VoiceOver and NVDA both skip it).
- **Fix**: start `spoken` as `""` and set the message in an effect after mount (one `requestAnimationFrame` or a 100 ms delay). Better still, render one persistent `role="status"` in `app/(call)/layout.tsx` and feed it through context, so the region survives setup → call → ended.

### M3. Sound blocked, disconnected and end failure are announced twice
- **WCAG**: 4.1.3 Status Messages. Also UX spec §8.2, "one status region".
- **Location**: `call-screen.tsx:163-198` (`ErrorState`, which is `role="alert"`) together with `lib/call-state.ts:276-283` (the same condition as the status message).
- **Evidence**: "Sound is blocked …" is pushed by the alert banner (assertive) and by the status line (polite). Disconnected and endError behave the same way.
- **Fix**: when an alert banner is shown for a condition, have `statusLine` return `""` for it. Or pass `alert={false}` to the banner and let the status line be the only announcer. Keep the alert for the blocking case only.

### M4. The Mute toggle's label and `aria-pressed` both change
- **WCAG**: 4.1.2 Name, Role, Value (A).
- **Location**: `components/features/call/call-controls.tsx:52-62`. It has `aria-pressed={muted}` and its label flips between "Mute" and "Unmute".
- **Evidence**: when muted it is announced "Unmute, toggle button, pressed". "Pressed" plus "Unmute" is contradictory: it is unclear whether pressing it mutes or unmutes.
- **Fix**: pick one model.
  - Either keep the label constant as "Mute" with `aria-pressed`, and change only the visible icon or word (visible "Unmute" can sit in an `aria-hidden` span next to an sr-only "Mute");
  - or drop `aria-pressed` and keep the changing label.
  - The first matches the spec's toggle model.

### M5. "We hear you", "Link copied" and "Copying is blocked" are not announced
- **WCAG**: 4.1.3 Status Messages (AA).
- **Location**:
  - `mic-check.tsx:117-120`;
  - `invite-panel.tsx:150-151` (the Copy button relabels to "Link copied");
  - `invite-panel.tsx:155`.
- **Evidence**:
  - The mic check's success, the only proof the mic works, appears silently.
  - The Copy button relabels while focused, which most screen readers do not re-announce.
  - The fallback hint "Press ⌘C" appears silently.
- **Fix**: send these through the page's status line once each ("Microphone working.", "Invite link copied.", "Copying is blocked; the link is selected, press Ctrl+C."). Do not add new live regions.

### M6. The disabled Start and Join buttons give no reason; start errors are not tied to a control
- **WCAG**: 3.3.2 Labels or Instructions (A). Also UX spec §8.10, "linked with `aria-describedby`".
- **Location**:
  - `call-experience.tsx:335-339`;
  - `join-experience.tsx:195`;
  - `call-experience.tsx:318-330`.
- **Evidence**:
  - Start: `disabled=true describedby=null`. Because it is disabled it is not in the Tab order, so keyboard and screen-reader users never meet it or the "Check your microphone first." hint.
  - The start `ErrorState` has no id and is not referenced by the button.
- **Fix**:
  - Use `aria-disabled="true"` instead of `disabled`, and block the click in `onSubmit`, which already checks `canStart`.
  - Add `aria-describedby` with the hint id and, when an error is present, the error id.
  - On submit with no mic, move focus to "Check microphone".

### M7. The invite time limit: the creator never gets the 1-minute warning
- **WCAG**: 2.2.1 Timing Adjustable (A). The warning is the minimum for a security-limited timeout. Also UX spec §8.12.
- **Location**:
  - `call-experience.tsx:211-254`: `statusExtra` is never passed to `CallScreen`, and `InvitePanel`'s countdown (`invite-panel.tsx:156`) is not live.
  - `join-experience.tsx:201`: the guest warning fires only while `left === 60`. A throttled background tab, where intervals run about once a minute, can skip that second.
- **Fix**:
  - Lift the countdown out of `InvitePanel` (or add an `onMinuteLeft` callback) and pass `statusExtra="The invite link expires in 1 minute."` when `left <= 60 && left > 0`, set once.
  - In Join, use `left <= 60` with a fired-once ref.

### M8. The workspace still removes the outline on the palette and form inputs
- **WCAG**: 2.4.7 Focus Visible (AA). Also UX spec §8.7.
- **Location**: `app/(dashboard)/dashboard.css:60`, `:190` and `:301`. Each sets `:focus { outline: none }` with specificity (0,2,1), which beats `.dash-root :focus-visible` (0,2,0) in `navigation.css:39`.
- **Evidence (Playwright)**:
  - Command palette input: `outline=none`, `border=rgb(29,32,34)` (none), `shadow=none`. Only the caret shows focus.
  - `/agents/new` "Agent name" input: `outline=none`.
  - The coral box-shadow replacement is `#ff624c` at 14% alpha, well under 3:1 (`--accent` itself is 2.71:1 on `--bg`).
  - `IMPLEMENTATION_NOTES.md` says these were overridden, but they were not.
- **Fix**: delete the `outline: none` declarations at lines 60, 190 and 301, or add `outline: 2px solid var(--focus); outline-offset: 2px;` in those rules. For the palette input, use `outline-offset: -2px` or a 2 px `--focus` bottom border.

### M9. At 400% zoom, the call screen leaves the transcript 16 px tall
- **WCAG**: 1.4.10 Reflow (AA) and 1.4.4 Resize Text (AA).
- **Location**:
  - `app/(call)/call.css:108`: `.call-screen { height: 100dvh; overflow: hidden }`;
  - `:324` and `:360-363`: the landscape rule caps people at 40dvh.
- **Evidence (320×256, equivalent to 1280×1024 at 400%)**: people strip 102 px, dock 81 px, header 48 px, `transcriptH: 16`. The transcript, which is the core content, can technically be scrolled, but only one line is visible at a time. There is no horizontal scroll, so that part passes.
- **Fix**: at `(height < 500px)`, let the page scroll instead of the panes. Set `.call-screen { height: auto; min-height: 100dvh; overflow: visible }`, make the dock `position: sticky; bottom: 0`, and give the transcript `min-height: 50dvh`. Alternatively, collapse the people strip to one line ("Ji-woo · Speaking") below 300 px of height.

### M10. The Transcript toggle's pressed state is nearly invisible
- **WCAG**: 1.4.11 Non-text Contrast (AA), which covers the visual information needed to identify a state.
- **Location**: `app/(call)/call.css:250`. Pressed uses a `--surface-2` background and a `--border-strong` border on `--surface-elevated`.
- **Evidence**:
  - Pressed vs unpressed background: 1.16:1 (light) and 1.05:1 (dark).
  - Border: 1.67:1 and 1.44:1.
  - The Mute toggle, by contrast, is inverted (15:1) and fine.
- **Fix**: give pressed dock toggles a `--border-control` border (3.27:1 light, 3.08:1 dark on elevated) plus a 2 px `--text` underline or bar. Or invert them like Mic.

---

## Minor

| # | WCAG | Location | Evidence | Fix |
| --- | --- | --- | --- | --- |
| m1 | 4.1.2 | `transcript.tsx:160`, `call-screen.tsx:156` | `aria-label` on a role-less `<div>` ("Transcript lines") and a `<span>` ("Call time 04:12"). ARIA 1.2 prohibits names on generic elements, and screen readers ignore them. | Scroller: `role="region"` (or `role="group"`) with the label. Timer: `<span><span class="sr-only">Call time </span>04:12</span>`. |
| m2 | 1.3.1 (best practice) | `call-screen.tsx:163-198`, `:235` | The sound-blocked, reconnecting and disconnected banners and the control dock sit outside any landmark. Landmark navigation cannot reach the controls. | Move the banners into `<main>` (top), and wrap the toolbar in `<section aria-label="Call controls">`, or put it inside `main`. |
| m3 | 2.1.1 (pattern) | `call-controls.tsx:39-50` | Arrow-key roving is added, but every button stays in the Tab order. That is harmless but not the toolbar pattern (one tab stop). | Either set `tabIndex=-1` on non-current buttons (a real roving tabindex) or drop the arrow handler. Document which one. |
| m4 | 2.5.8 (AA is met), spec 44 px | `call.css:36-40`, `:242`; `navigation.css:15,19,48-51`; `call-dialog.tsx:72` | Phone: theme toggle 40×40 (38×38 in the workspace), Start a call and Menu icon buttons 38×38, swap 44×40, sheet Close 40×40, Jump to latest 32 px tall. `data-size="sm"` (32 px) beats the `pointer: coarse` 44 px rule on specificity. The checkbox is 18×18, but its 44 px label passes. All of these are ≥ 24 px, so they pass AA but miss the design system's 44 px. | Add `@media (pointer: coarse)` rules after the size variants with `[data-size]` and `[data-icon]` included; set `.dash-start`, `.dash-menu-button` and `.theme-toggle` to 44 px on coarse pointers. |
| m5 | 1.3.1 | `call-dialog.tsx:58-62`, `call-screen.tsx:249-258` | The End confirm has `aria-labelledby` but no `aria-describedby`, so the consequence ("Ji-woo will be disconnected too") is not read with the title. | Add a `describedBy` prop that points at the body paragraph. Optionally use `role="alertdialog"` for the confirm. |
| m6 | 1.3.1 | `call-screen.tsx:284`, `:303` | "Keyboard shortcuts" and "Coming later" look like headings but are `<p>`. | Use `<h3 className="call-panel-title">`. |
| m7 | 3.1.2 | `language-select.tsx:21-23` | `<option>` text "Korean · 한국어" mixes languages and cannot hold a `lang` span. This is acceptable (typeahead is the stated reason). | None needed; optional `lang` on the option for single-language entries. |
| m8 | 4.1.3 (chattiness) | `status-indicator.tsx:18-24` | The debounce only suppresses an identical consecutive message, which deps already prevent. A flapping A → B → A ("Ji-woo lost connection. Reconnecting…" ↔ "") re-announces within 5 s, against spec §8.2. | Keep a map of message → last time spoken, and skip any message spoken in the last 5 s. |
| m9 | 1.4.11 | `call.css:146`, `:204`, `:321` | The waiting card's dashed border is `--border-control` on `--bg` at 2.996:1 (light), just under 3:1. Unlit connection bars are 1.65:1, and on phones the connection word is visually hidden, so "Offline" or "Connection lost" shows as three faint bars. The status line and banners carry text, so this is not a hard fail. | Use `--text-2` for the waiting border (6.12:1). On phones, keep the word visible when tone ≠ success. Use `--state-idle` (3.24:1) for unlit bars. |
| m10 | 2.4.3 | `call-screen.tsx:132`, `call.css:117` | With focus inside the transcript scroller, pressing T hides the panel with `display:none`, and focus is lost. | When hiding, if `document.activeElement` is inside the transcript, move focus to the Transcript toggle. |
| m11 | 2.3.3 (AAA) / spec §5.5 | `app/tokens.css:227-229` | The global reduced-motion block only zeroes the duration tokens. Hard-coded animations outside `.call-root` (e.g. `dashboard.css` `palette-in`, `fade-in .25s`) are not covered. The call routes, menu sheet and landing are covered (verified). | Add the spec's `*, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }` to `tokens.css`. |

---

## Checks that passed (with evidence)

- **Landmarks and headings**:
  - `/call` setup has `header`, `main#main-content`, h1 "Start a call", and a form with labelled controls (`<label for>`, fieldset/legend for the mic).
  - The call screen has one `main` and one h1, read as "English and 한국어 call". The ↔ is `aria-hidden` and "and" is sr-only.
  - `<section aria-label="Participants">`, a transcript section with an h2, and `role="toolbar" aria-label="Call controls"`.
  - `/join` has h1 "Join the call".
- **Dialogs** (verified):
  - More sheet: focus starts on "Close", Tab stays inside, Esc closes, and focus returns to "More".
  - Details opened from More: Esc returns focus to "More".
  - End confirm: focuses **Cancel**, and Esc returns focus to "End call".
  - Workspace menu sheet (390 px): focuses "Close menu", Tab stays in the sheet, Esc returns focus to "Menu".
  - The workspace More ▾ disclosure closes on Esc and returns focus to its summary.
- **Visible focus on call routes**: every focusable in the Tab walks showed `outline: solid 2px rgb(40,62,232)` (light). `--focus` contrast is ≥ 5.9:1 on every call surface in both themes. The h1 targets that only receive programmatic focus (`tabIndex=-1`) suppress the outline, which is acceptable.
- **Focus on connect**: in the fixture's live state the h1 is focused on load.
- **Live regions**:
  - One `role="status"` per page.
  - The transcript announcer is a separate `role="log" aria-live="polite" aria-relevant="additions"`. It carries only the other person's completed lines with `lang` ("Ji-woo: What time is the meeting tomorrow?", `lang=en`), is capped at 5 nodes, and can be turned off in More.
  - The visible transcript list is not live.
  - Speaking/listening flips and meters are never announced (meters are `aria-hidden`).
  - Polite vs assertive is used correctly apart from M3.
- **Transcript `lang`**: every original and translation line carries `primary_language` (`ko` / `en` verified). `:lang(ko) { word-break: keep-all }`.
- **Icon buttons**: Swap ("Swap languages"), sheet Close ("Close"), Menu Close ("Close menu"), the Search trigger and the theme switch (`role="switch" aria-checked`, "Dark theme") all have names. Dock buttons have visible text labels. All SVGs are `aria-hidden focusable="false"`. Transcript toggle `aria-pressed` is correct.
- **Not colour alone**:
  - Seat colours always come with text: the "You" chip and name on cards, "You"/name in `.turn-who`, the name on the join pair and ended list.
  - Speaking vs listening differs by word, by ring width (3 px vs 2 px) and by font weight as well as hue.
  - Muted has a mic-off icon, the word and a dashed ring.
  - Hearing translation is a lime chip with a sound icon and the word.
  - The bridge direction is in its `role="img"` name.
- **Reduced motion** (`reducedMotion: "reduce"`):
  - `.bridge-packet` is `display:none`, and the arrow stays as a static cue.
  - `turn-in` runs for `1e-05s × 1`.
  - The binary meter has `animation: none`.
  - The connection ring is a static ring (`animationDuration 1e-05s`, with the gap moved to the top).
  - `--dur-base: 0s`.
  - The landing has 0 running animations and 0 canvases.
  - The theme toggle skips the circular View Transition.
  - `LevelStore` uses 3 buckets at ≤ 2 Hz.
- **Contrast (tokens.css)**: every text and UI pair in normal use passes in both themes. The table below is computed from the hex values and matches the design system's table to within ±0.02. Failures appear only when opacity is applied (S6) and for the state indicators in M10 and m9.
- **Landing hero**: the illustration is `<figure aria-labelledby>` with an sr-only caption that describes the scene. The window is `aria-hidden`. There is one h1 and no animation loop.

### Computed contrast (selected pairs)

| Pair | Light | Dark | Needs |
| --- | --- | --- | --- |
| `--text` / `--bg` | 15.00 | 15.35 | 4.5 |
| `--text-2` / `--surface-2` (transcript meta) | 5.74 | 7.23 | 4.5 |
| `--text-muted` / `--bg` (hints) | 4.79 | 6.67 | 4.5 |
| `--text-muted` / `--surface` (hints in mic check, invite) | 5.18 | 6.11 | 4.5 |
| `--text-muted` / `--surface-2` | **4.49** (only aria-hidden initials of waiting/left avatars) | 5.71 | 4.5 |
| `--id-self` / `--surface-2` ("You" in transcript) | 5.22 | 7.59 | 4.5 |
| `--id-other` / `--surface-2` | 5.60 | 6.53 | 4.5 |
| `--id-self` / `--id-self-tint` (speaking card) | 5.26 | 6.54 | 4.5 |
| `--id-other` / `--id-other-tint` | 5.40 | 6.11 | 4.5 |
| `--interp-ink` / `--surface-2` ("Translated", pending) | 5.67 | 12.73 | 4.5 |
| `--interp-on` / `--interp` ("Hearing translation") | 13.28 | 14.87 | 4.5 |
| `--warning` / `--warning-tint` (Weak connection chip) | 5.61 | 7.85 | 4.5 |
| `--text-2` / `--danger-tint` (error copy) | 5.70 | 7.05 | 4.5 |
| white / `--danger-solid` (End call) | 6.57 | 5.37 | 4.5 |
| `--border-control` / `--surface` (inputs) | 3.24 | 3.47 | 3 |
| `--state-idle` / `--surface` (listening ring) | 3.24 | 3.47 | 3 |
| `--focus` / `--surface-elevated` (dock, dialogs) | 7.13 | 5.91 | 3 |
| Reconnecting card text at opacity .6 | **2.72–2.84** | **3.33–4.06** | 4.5 (S6) |
| Pressed dock toggle bg / elevated | **1.16** | **1.05** | 3 (M10) |

## Recommended order of fixes

1. S2 (one CSS line), S5 (one CSS line), M8 (three declarations), S6 (CSS).
2. S1 and M6 together: a stable Start button with `aria-disabled`, plus deliberate focus moves.
3. S4, M2, M3, M5 and M7 together: make the status line a persistent, transition-aware announcer in the call layout.
4. S3 (shortcut setting), M4 (mute semantics), M1 (`LanguageName` component).
5. M9, M10, then the minor items.

After the fixes, re-test with VoiceOver (Safari, iOS) and NVDA (Firefox) on a real two-person ko↔en call. Neither was available for this audit.
