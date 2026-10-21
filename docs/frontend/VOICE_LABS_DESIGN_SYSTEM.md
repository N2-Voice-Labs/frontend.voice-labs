# Voice Labs design system

Agent 3 of 5 (UI Designer). Date: 2026-10-21. Status: spec for review; no production code changed.

Inputs: `docs/frontend/workflow/BRIEF.md`, `docs/frontend/FRONTEND_AUDIT.md`,
`docs/frontend/VOICE_LABS_UX_SPEC.md`, `app/globals.css`, `app/theme-shared.css`,
`app/(dashboard)/*.css`, `app/(marketing)/*.css`, `app/(dashboard)/agents/[id]/test/playground.css`,
`app/layout.tsx`, `docs/design-resource-audit.md`, `.agents/skills/*`.

Companion file: `docs/frontend/visual-directions.html`. It is a static page that renders the same
call screen in all three directions and in the recommended hybrid, in light and dark.

Constraints this document follows:

- **No design-system library** (AGENTS.md). The system is CSS custom properties plus small in-repo
  React components under `components/ui/` and `components/features/call/`.
- **No new UI dependencies.** One new `next/font/google` face (Noto Sans KR) is proposed. It is a
  font, not a package, and it is self-hosted by Next.
- **CSS animation only in the app area.** `gsap`, `animejs` and `lenis` stay landing-only. The
  workspace and call screens need none of them (see §5.5).
- Light and dark through the existing `html[data-vl-theme]` switch.
- WCAG AA. Every ratio below was computed with the WCAG 2.x relative-luminance formula.
- `prefers-reduced-motion` respected everywhere, with a defined fallback for each moving state.

Rule from the UX spec, kept here: **visuals show only what the system knows.** No animation runs
unless a real signal (LiveKit event, level, poll result) is driving it.

---

## 1. Visual directions

All three directions render the same screen: Sam (English, hears Korean) and Ji-woo (Korean, hears
English), seen from Sam's side, with Ji-woo speaking and the interpreter translating. See
`visual-directions.html`.

### Direction A: Premium Communication

| | |
| --- | --- |
| **Concept** | A quiet, editorial call room. Typography and spacing carry the hierarchy; colour is almost absent. The product looks like a well-made communication tool, the way good stationery looks like stationery. |
| **Mood** | Calm, confident, spacious, grown-up. |
| **Type pairing** | Manrope 600 for names and headings (already loaded), DM Sans for body (already loaded), DM Mono for small labels and times (already loaded). |
| **Palette** | Current warm paper `#f6f5ef` and ink `#1d2022`. One accent: voice coral (`#ff624c`, text-safe `#b5372a`). No second hue. Dark: `#121516` / `#ecebe4`. |
| **Call screen** | Large names, generous white space, hairline borders, cards almost flat. |
| **Interpreter bridge** | A 1 px ink hairline between the two cards with a small arrowhead and a mono caption ("Translating into English"). |
| **Speaking / translating** | Speaking: a coral ring around the avatar and five thin bars. Translating: the hairline gets a short dash that moves along it. |
| **Motion character** | Slow, sparse, eased: 240–360 ms fades and small moves. |
| **Risks** | One accent means *who* is speaking and *what* is happening share one colour, so the two people are told apart only by position and name. At a glance from across a room it reads as "elegant but quiet"; state can be missed. Close to the current landing page, so it is less of a step change. |

### Direction B: Technical Realtime

| | |
| --- | --- |
| **Concept** | A precise instrument panel for live speech. Every state is measured: segmented level meters, a signal path with timing ticks, timecodes. |
| **Mood** | Exact, alert, fast, engineered. |
| **Type pairing** | DM Mono as the main voice for labels, times and states; Manrope 600 for names; DM Sans for transcript body. |
| **Palette** | Cool graphite first: `#0e1112` / `#161a1b`, text `#e6e8e3`, signal lime `#d9f455`, a cyan `#5fd4e8` for the interpreter path, coral for errors. The light variant is a cool grey `#f2f3f1`. |
| **Call screen** | Grid lines, small caps-free mono labels, 10-segment meters on both cards, a latency readout on the bridge. |
| **Interpreter bridge** | A "signal path": a dotted line with tick marks and a small readout ("≈ 1.2 s"). Packets move along it while translating. |
| **Speaking / translating** | Speaking: segments light from left to right with the level. Translating: cyan packets move along the path toward the listener. |
| **Motion character** | Quick, linear, mechanical: 90–160 ms steps, no easing flourishes. |
| **Risks** | Drifts toward the "dev-only monitoring dashboard" the brief rules out. Mono text everywhere hurts long transcript reading, and Hangul has no mono face, so the mix looks broken. Latency numbers are not available live today (`runtime-state` filters `LatencyMeasured`, audit §1.6), so the bridge readout would be fake. Dark-first fights the light theme. |

### Direction C: Human + AI

| | |
| --- | --- |
| **Concept** | Two people, two lanes, one interpreter between them. Each person owns a colour that follows them everywhere (avatar, name, transcript rule). The interpreter is a thin signal "thread" that only lights when it works. |
| **Mood** | Warm, human, conversational, quietly clever. |
| **Type pairing** | Newsreader (serif, Google) for headings and translated quotes; DM Sans for UI and body. |
| **Palette** | Warm cream `#f7f1e8` / `#fffaf3`, ink `#2a211c`, identity teal `#0f6e6a` (you) and plum `#9b3a6e` (them), interpreter lime, terracotta accent. Dark: `#1a1512` / `#241d19`. |
| **Call screen** | Rounded cards (14–16 px radius), initials avatars in identity colours, transcript split into the two people's lanes. |
| **Interpreter bridge** | A curved thread between the two avatars, drawn in interpreter lime. A small dot travels along it toward the listener while translating. |
| **Speaking / translating** | Speaking: the person's avatar ring and bars in *their* colour. Translating: the thread lights and the dot moves toward the listener. |
| **Motion character** | Soft, organic, 200–320 ms, gentle ease-out. |
| **Risks** | Warm cream plus serif plus rounded cards can slide into "lifestyle app" and lose "technical, production-ready". Newsreader has no Hangul and no Cyrillic, so serif quotes in Korean or Russian fall back to a sans and look uneven. A second family adds weight. A curved SVG thread is harder to lay out responsively than a straight rule. |

### Comparison against the brief's acceptance criteria

Scores 1–5 (5 = best). Only criteria a visual direction can affect are scored; 9 (realtime still
works) and 14 (tests pass) do not depend on the direction.

| # | Criterion | A Premium | B Technical | C Human + AI | **A × C (recommended)** |
| --- | --- | --- | --- | --- | --- |
| 1 | Understand the product in about 5 s | 4 | 2 | 5 | **5** |
| 2 | Starting/joining a call is obvious | 4 | 3 | 4 | **5** |
| 3 | Participants and languages understood at once | 3 | 3 | 5 | **5** |
| 4 | Speaking and translation state clear | 3 | 5 | 4 | **5** |
| 5 | Transcript and translated speech easy to follow | 4 | 2 | 4 | **5** |
| 6 | Call controls obvious | 4 | 4 | 4 | **4** |
| 7 | Communication product, not AI dashboard | 5 | 1 | 5 | **5** |
| 8 | Distinctive identity | 3 | 3 | 4 | **4** |
| 10 | Desktop + mobile intentional | 4 | 3 | 3 | **4** |
| 11 | Animations aid understanding | 3 | 4 | 4 | **5** |
| 12 | Maintainable (fewest new tokens, faces, special cases) | 5 | 3 | 2 | **4** |
| 13 | No unnecessary dependencies | 5 | 5 | 4 | **5** |
| | **Total (of 60)** | **47** | **38** | **48** | **56** |

### Recommendation: A × C, "two lanes, one bridge"

Take **A's foundation** and **C's structure**, and use B's precision only in two places: the level
meter and the Technical details drawer.

From **A** (kept):

- The existing paper/ink palette, Manrope/DM Sans/DM Mono, hairline borders and small radii.
  Reason: it is already the brand, it already passes AA (after one fix, §2.4), and it costs nothing.
  It is also the strongest guard against "gradient card soup".
- Restraint: large calm type, one primary action per screen, no decorative motion.

From **C** (adopted):

- **Identity colours per participant**: teal for *you*, plum for *the other person*. Reason: brief
  priorities 1 and 4 (people, language). Colour says *who*, shape and motion say *what*. This
  removes A's main risk, where one coral meant both "who" and "speaking".
- **The interpreter as a bridge, not a third person**, drawn in the existing signal lime. Reason:
  it makes "who hears what" visible, which the UX spec §5.1 requires, and it reuses a brand colour
  that already means "signal" in this product.
- Two-lane transcript with a coloured speaker rule. Reason: readers can follow a turn by colour
  without reading names.

From **B** (confined):

- A 5-bar level meter driven by the real level, and mono tabular numbers for timers. Reason: real
  signals look trustworthy; precision belongs in the meter, not in the whole page.
- Latency, identities and quality numbers stay in **Technical details** (UX spec layer C).

Rejected:

- C's serif and cream. Reason: Newsreader lacks Hangul and Cyrillic, which are the product's core
  languages, and a second family adds weight for little gain. The paper palette is already warm.
- B's dark-first graphite and full-mono UI. Reason: it reads as a monitoring console (brief "must
  not") and does not work for Hangul.
- Colour per language. Reason: 14 languages would need 14 hues that collide with state colours, and
  the same language swaps sides between the two viewers' perspectives. Language is shown as text
  (English name plus native name) and a mono code chip (`KO`, `EN`).

---

## 2. The system (recommended direction A × C)

### 2.1 Typography

**Families** (all through `next/font/google`, self-hosted; three already loaded in `app/layout.tsx`):

| Token | Family | Role | Change |
| --- | --- | --- | --- |
| `--font-display` | Manrope (latin, cyrillic) | Headings, participant names, buttons | Keep |
| `--font-sans` | DM Sans (latin) | Body, UI text, transcript | Keep |
| `--font-mono` | DM Mono 400/500 (latin) | Labels, times, language codes, technical values | Keep |
| `--font-hangul` | **Noto Sans KR** (variable, `preload: false`, `display: "swap"`) | Hangul fallback for all stacks | **New** |

Stacks (replace the current ones in `globals.css`):

```css
--sans:    var(--font-sans), var(--font-display), var(--font-hangul), "Hiragino Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif;
--display: var(--font-display), var(--font-hangul), "Hiragino Sans", "PingFang SC", system-ui, sans-serif;
--mono:    var(--font-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
```

Reasons:

- **Cyrillic in body text.** DM Sans has no Cyrillic, so Russian falls to Arial today. Putting
  Manrope (already loaded, has Cyrillic) second in `--sans` fixes this at zero cost.
- **Hangul.** None of the current faces has Hangul (audit §4), and Korean is in the main demo.
  Noto Sans KR is on Google Fonts and is served as unicode-range slices. With `preload: false`
  the browser fetches only the slices for glyphs on screen, so English-only pages download nothing.
  Agent 4: Noto Sans KR lists no `korean` subset in `next/font`'s font data, so `preload` must be
  `false` (subsets are only needed for preloading). Check the `next/font` doc in
  `node_modules/next/dist/docs/` before wiring it.
- **Japanese and Chinese** use system CJK faces for now. They are supported interpreter languages
  but not in the main demo; adding Noto Sans JP/SC later is the same one-line pattern.
- `--serif` (system serif) stays for landing editorial accents only.

**Scripts:**

- Every transcript line and language name sets `lang` (`ko`, `en`, `ru` …).
- `:lang(ko) { word-break: keep-all; line-break: strict; }` keeps Korean words whole.
- `:lang(ko), :lang(ja), :lang(zh) { letter-spacing: 0; }` because negative heading tracking
  crushes CJK.
- `font-variant-numeric: tabular-nums` on timers, countdowns and meters.

**Scale (app area).** The landing keeps its existing display tokens (`--text-display`,
`--text-h2-lg`, `--text-h2`, `--text-h2-sm`).

| Token | Size / line-height | Family, weight, tracking | Use |
| --- | --- | --- | --- |
| `--type-h1` | 28/34 (24/30 below 640 px) | Manrope 600, -0.02em | Page titles |
| `--type-h2` | 20/28 | Manrope 600, -0.015em | Section titles, dialog titles |
| `--type-h3` | 16/24 | Manrope 600, -0.01em | Card titles, panel titles |
| `--type-name` | 20/26 (17/22 on S strip) | Manrope 600, -0.015em | Participant names |
| `--type-call-title` | 16/22 | Manrope 600 | Call header language pair |
| `--type-body-lg` | 17/28 | DM Sans 400 | Transcript primary line, lead text |
| `--type-body` | 15/24 | DM Sans 400 | Default UI text |
| `--type-body-sm` | 14/22 | DM Sans 400 | Transcript secondary line, help text |
| `--type-small` | 13/20 | DM Sans 500 | Meta, chip text, state words |
| `--type-label` | 12/16 | DM Mono 500, +0.02em, sentence case | Field labels in dense UI, language codes, times |
| `--type-code` | 13/20 | DM Mono 400 | IDs, technical values |

Rules: nothing below 12 px in the app (11 px stays a landing-only label size); body measure
max 68ch; `text-wrap: balance` on headings and `pretty` on paragraphs; mono is never used for
sentences, and never for Hangul (DM Mono has none).

### 2.2 Spacing

4 px base. Names are multiples of 4, which matches the existing `--space-4` … `--space-12`.

| Token | px | Typical use |
| --- | --- | --- |
| `--space-1` | 4 | Icon-to-text gap inside chips |
| `--space-2` | 8 | Tight stacks, chip padding |
| `--space-3` | 12 | Control inner gaps, list rows |
| `--space-4` | 16 | Card padding (S), page gutter on mobile |
| `--space-5` | 20 | Card padding (M+) |
| `--space-6` | 24 | Between related groups |
| `--space-7` | 28 | (existing; keep) |
| `--space-8` | 32 | Between sections inside a page |
| `--space-10` | 40 | Page top padding |
| `--space-12` | 48 | Large section gaps |
| `--space-16` | 64 | Page-level separation (desktop) |

`--section-*` tiers stay landing-only.

### 2.3 Radii and elevation

| Token | Value | Use | Change |
| --- | --- | --- | --- |
| `--radius-control` | 4 px | Buttons, inputs, selects | was 3 px |
| `--radius-row` | 4 px | List rows, transcript rows | keep |
| `--radius-surface` | 6 px | Cards, panels, participant cards | was 5 px |
| `--radius-window` | 8 px | Dialogs, sheets, popovers, product windows | was 6 px |
| `--radius-pill` | 999 px | Avatars, state chips, dock mic button, toasts | new |

Reason: the 3/4/5/6 px steps differ too little to be seen and are applied inconsistently.
Small radii stay because they are part of the brand's crisp, editorial look; only avatars, chips
and the mic are round, so round means "a person or a live control".

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--elev-0` | none (1 px `--border`) | none (1 px `--border`) | Cards in flow |
| `--elev-1` | `0 1px 2px rgb(29 32 34 / 8%)` | `0 1px 2px rgb(0 0 0 / 40%)` | Raised card, active participant card, dock |
| `--elev-2` | `0 2px 4px rgb(29 32 34 / 8%), 0 12px 24px -8px rgb(29 32 34 / 18%)` | `0 2px 4px rgb(0 0 0 / 40%), 0 12px 24px -8px rgb(0 0 0 / 55%)` | Popover, toast, select menu |
| `--elev-3` | = current `--shadow-window` | = current marketing dark `--shadow-window` | Dialog, sheet |

Shadows are tinted with ink, from one light source above. In dark, elevation also lightens the
surface (`--surface` → `--surface-elevated`), because shadows barely show on dark.

### 2.4 Colour tokens

Defined once at `:root` (light) and once under `html[data-vl-theme="dark"]` (dark), in a new
`app/tokens.css` imported by `app/layout.tsx` before `globals.css`. Reason: today dark tokens are
scoped to `.marketing-root` and `.dash-root`, so a new call route group would get no dark theme at
all. A no-JS fallback repeats the dark block under
`@media (prefers-color-scheme: dark) { html:not([data-vl-theme]) { … } }`.

**Core**

| Token | Light | Dark | Notes |
| --- | --- | --- | --- |
| `--bg` | `#f6f5ef` | `#121516` | Page background (was `--paper`) |
| `--surface` | `#fffefa` | `#1a1e1f` | Cards |
| `--surface-2` | `#efeee6` | `#1f2425` | Sunken areas, transcript panel, inputs on cards |
| `--surface-elevated` | `#ffffff` | `#222829` | Dialogs, popovers, dock |
| `--text` | `#1d2022` | `#ecebe4` | Primary text (was `--ink`) |
| `--text-2` | `#5a5d58` | `#aeb1aa` | Secondary text (was `--ink-2`) |
| `--text-muted` | `#6b6d69` | `#9a9d96` | Meta text. **Light value changed** from `#747675`, which is 4.19:1 on paper and fails AA |
| `--text-faint` | `#7a7d77` | `#7f847d` | Large or decorative text only (≥ 24 px, or ≥ 19 px bold) |
| `--border` | `#dfdfd8` | `#2e3435` | Hairlines between surfaces (decorative, no contrast requirement) |
| `--border-strong` | `#c9c9c1` | `#3a4142` | Section rules, header button outlines |
| `--border-control` | `#8d8f88` | `#6b7374` | Input/select/checkbox outlines (needs 3:1) |
| `--primary` | `#1d2022` | `#ecebe4` | Primary button background (ink, as today) |
| `--on-primary` | `#ffffff` | `#121516` | Text on primary |
| `--primary-hover` | `#383d3e` | `#ffffff` | |
| `--secondary` | `transparent` + `--border-control` | same | Secondary button = outlined |
| `--accent` | `#ff624c` | `#ff7a66` | Brand voice coral: logo dot, illustrations. **Not for text in light** (2.71:1) |
| `--accent-text` | `#b5372a` | `#ff7a66` | Coral as text/links |
| `--focus` | `#283ee8` | `#8f9bff` | Focus ring |
| `--success` | `#1b6e36` | `#6fd58f` | "We hear you", saved, connected |
| `--success-tint` | `#e5f2e8` | `#173322` | |
| `--warning` | `#8a5300` | `#f2b33d` | Weak connection, reconnecting, expiring |
| `--warning-tint` | `#fbf0dc` | `#33270f` | |
| `--danger` | `#b42318` | `#ff8a80` | Errors as text/icons |
| `--danger-tint` | `#fbe9e7` | `#3a1d1b` | |
| `--danger-solid` | `#b42318` | `#c4362b` | End call button background (white text both themes) |

**Participant identity**

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--id-self` | `#0f6e6a` (teal) | `#4fc6bd` | You: avatar ring, name, transcript rule, level bars |
| `--id-self-tint` | `#e6f1ef` | `#163331` | Your card when you speak, your transcript row hover |
| `--id-other` | `#9b3a6e` (plum) | `#e48bbd` | The other person |
| `--id-other-tint` | `#f4e6ee` | `#3a2030` | |
| `--id-agent` | `#5a5d58` | `#aeb1aa` | An AI agent participant (agent test page) |

Rule: identity is by **seat**, not by language. In both viewers' screens *you* are teal and *they*
are plum, so every user learns one rule: "teal is me". Reason: per-language colours would swap
between the two viewers and collide with state colours.

**Interpreter and realtime state**

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--interp` | `#d9f455` (signal lime) | `#d9f455` | Bridge fill, translating packet, "hearing translation" chip fill |
| `--interp-ink` | `#566300` | `#d9f455` | Bridge line and label text on surfaces |
| `--interp-on` | `#1d2022` | `#121516` | Text on `--interp` fill |
| `--interp-tint` | `#eef7c4` | `#2a3110` | Bridge background while active |
| `--state-idle` | `#8d8f88` | `#6b7374` | Listening ring, idle bars (UI, 3:1) |
| `--state-muted` | `#6b6d69` | `#9a9d96` | Muted icon and word |

Speaking uses the speaker's identity colour; translating uses the interpreter colours;
reconnecting and degraded use `--warning`; errors use `--danger`. See §4.

**Measured contrast (WCAG 2.x)**

| Pair | Light | Dark | Requirement |
| --- | --- | --- | --- |
| `--text` on `--bg` | 15.00 | 15.35 | 4.5 ✔ |
| `--text` on `--surface` | 16.23 | 14.06 | 4.5 ✔ |
| `--text` on `--surface-elevated` | 16.38 | 12.52 | 4.5 ✔ |
| `--text-2` on `--surface` | 6.62 | 7.74 | 4.5 ✔ |
| `--text-2` on `--surface-2` | 5.74 | — | 4.5 ✔ |
| `--text-muted` on `--bg` | 4.79 (old `#747675`: 4.19 ✘) | 6.67 | 4.5 ✔ |
| `--text-muted` on `--surface-2` | 4.49 → use `--text-2` on `--surface-2` | 5.44 (on elevated) | see note |
| `--text-faint` on `--bg` (large only) | 3.82 | 4.80 | 3.0 ✔ |
| `--on-primary` on `--primary` | 16.38 | 15.35 | 4.5 ✔ |
| `--accent-text` on `--bg` | 5.42 | 7.19 | 4.5 ✔ |
| `--accent` on `--bg` | 2.71 (decorative only) | 7.19 | — |
| `--focus` on `--bg` | 6.53 | 7.25 | 3.0 ✔ |
| `--border-control` on `--surface` | 3.24 | 3.47 | 3.0 ✔ |
| `--id-self` on `--surface` | 6.02 | 8.12 | 4.5 ✔ |
| `--id-self` on `--id-self-tint` | 5.26 | 6.54 | 4.5 ✔ |
| `--id-other` on `--surface` | 6.45 | 6.98 | 4.5 ✔ |
| `--id-other` on `--id-other-tint` | 5.40 | 6.11 | 4.5 ✔ |
| `--interp-ink` on `--bg` | 6.05 | 14.87 | 4.5 ✔ |
| `--interp-on` on `--interp` | 13.28 | 14.87 | 4.5 ✔ |
| `--interp-ink` on `--interp-tint` | 6.72 (`#4e5a00`) | 11.02 | 4.5 ✔ |
| `--warning` on `--bg` / `--surface` | 5.79 / 6.27 | 9.19 (surface) | 4.5 ✔ |
| `--warning` on `--warning-tint` | 5.61 | — | 4.5 ✔ |
| `--danger` on `--bg` | 6.02 | 8.04 | 4.5 ✔ |
| `--danger` on `--danger-tint` | 5.61 | — | 4.5 ✔ |
| white on `--danger-solid` | 6.57 | 5.37 | 4.5 ✔ |
| `--success` on `--surface` | 6.25 | 9.28 | 4.5 ✔ |
| `--state-idle` on `--surface` (UI) | 3.24 | 3.47 | 3.0 ✔ |

Note: `--text-muted` on `--surface-2` is 4.49 in light, just under 4.5. Use `--text-2` for text on
sunken surfaces. Agent 4 should re-check any new pair with the same formula; the dark tints marked
"—" carry only `--text`, which passes everywhere.

Lime in light: `#d9f455` is a fill only, always with ink text on it. As a line or text on paper it
fails, so the light theme uses `--interp-ink` (`#566300`) for strokes and labels. This fixes the
audit's unverified "lime text on dark" concern: lime as text appears only in dark (14.87:1).

### 2.5 Token migration map

Phase 1 keeps every old name working as an alias, so nothing breaks; Phase 2 replaces uses file by
file and removes hard-coded hex values (the audit counts 58 in `globals.css`, 84 in
`dashboard.css`, 93 in `dashboard-dark.css`, 37 in `playground.css`).

| Current token | New token | Action |
| --- | --- | --- |
| `--paper` | `--bg` | Alias `--paper: var(--bg)` |
| `--surface` | `--surface` | Keep (now has a global dark value) |
| `--paper-2` | `--surface-2` | Alias; light `#e9e9df` → `#efeee6` (closer to paper, keeps `--text-2` ≥ 5.7:1) |
| `--ink` | `--text` | Alias `--ink: var(--text)` |
| `--ink-2` | `--text-2` | Alias |
| **`--ink-3: var(--ink-3)`** (self-reference, invalid) | `--text-faint` | **Fix:** `--ink-3: var(--text-faint)` → `#7a7d77` light / `#7f847d` dark. Only use is the italic serif `em` in landing headings (large text, 3.82:1 ✔) |
| `--muted` | `--text-muted` | Alias; **light value `#747675` → `#6b6d69`** (AA fix) |
| `--line` | `--border` | Alias |
| **`--line-strong: var(--line-strong)`** (self-reference, invalid in light) | `--border-strong` | **Fix:** `#c9c9c1` light (the value already hard-coded on `.header-access` and `.theme-toggle`) / `#3a4142` dark. Used by `.capability-list`, `.showcase-rail`, `.compare-head` |
| **`--band-ink-2: var(--band-ink-2)`** (self-reference, invalid) | `--band-text-2` | **Fix:** `#b4b7b0` (7.71:1 on `--band #202425`; 8.20:1 on dark band `#1a1f20`). Used by the landing signal and stats bands |
| `--band`, `--band-ink`, `--band-line` | `--band`, `--band-text`, `--band-border` | Landing-only; alias |
| `--accent` | `--accent` | Keep; dark `#ff7a66` |
| `--accent-dark` | `--accent-text` | Alias `--accent-dark: var(--accent-text)` (light was `#e54b38`, 3.56:1 as text; it is used for hover colour and arrows, so the AA-safe value is an improvement) |
| `--accent-text` | `--accent-text` | Keep |
| `--accent-button`, `--accent-button-hover` | `--primary` / `--danger-solid` | Coral buttons become ink primary. Remove after the landing CTA is restyled |
| `--signal` | `--interp` | Alias `--signal: var(--interp)`. Lime now means "interpreter / signal" only |
| `--focus` | `--focus` | Keep; dark `#8f9bff` moves global |
| `--radius-control/row/surface/window` | same names | New values 4/4/6/8 |
| `--shadow-window` | `--elev-3` | Alias |
| `--motion-fast`, `--motion-standard` | `--dur-fast`, `--dur-base` | Alias, same values |
| `--ease-standard` | `--ease-standard` | Keep |
| `--ease-expo` (defined twice: `dashboard.css:3`, `motion.css:4`) | `--ease-out` | Define once in `tokens.css`; both files alias or drop their copy |
| `--text-display` … `--text-label` | landing keeps; app uses `--type-*` | No change for landing |
| `--space-4…12` | `--space-1…16` | Superset; existing values unchanged |
| `--serif`, `--sans`, `--display`, `--mono` | same | New stacks (§2.1) |
| Playground hard-coded stage colours (`#8d948f`, `#ff6a55`, `hsl(var(--hue)…)`, `#d4a23f`) | `--state-idle`, `--id-*`, `--interp`, `--warning` | Replace when the agent test page is re-laid out (UX spec P2) |
| `.dash-root` and `.marketing-root` dark token blocks | global `html[data-vl-theme="dark"]` block | Move token flips to `tokens.css`; keep the per-area files only for real per-area overrides, and shrink `dashboard-dark.css` as hard-coded values become tokens |
| 404 tokens in `theme-shared.css:20-24` | global dark block | Delete once `tokens.css` lands (the 404 then inherits) |

---

## 3. Components

Shared rules for every component:

- **Focus:** `outline: 2px solid var(--focus); outline-offset: 2px` on `:focus-visible`. Never
  replaced by a box-shadow (UX spec §8.7; fixes `dashboard.css:59,189,300`).
- **Hit area:** ≥ 44×44 px on coarse pointers; ≥ 32 px tall on fine pointers for dense UI.
- **Disabled:** `opacity: .45` is not enough on its own; disabled controls also lose hover, get
  `cursor: not-allowed`, and keep their text at ≥ 3:1. Prefer hiding unavailable *call* controls
  (UX spec §5.5) to disabling them.
- **Loading:** a component in a loading state keeps its size (no layout shift) and sets
  `aria-busy="true"`.
- Built as small files in `components/ui/` (generic) and `components/features/call/` (call-only),
  styled with plain CSS classes using the tokens above.

### 3.1 Button

- **Anatomy:** optional leading icon (16 px), label (`--type-small` 600 Manrope, or 15 px for
  `lg`), optional trailing icon.
- **Variants:** `primary` (ink fill), `secondary` (outlined, `--border-control`), `ghost` (text
  only, hover `--surface-2`), `danger` (`--danger-solid` fill, white text), `icon` (square, needs
  `aria-label`). Sizes: `sm` 32 px, `md` 40 px, `lg` 48 px.
- **States:** hover = `--primary-hover` / `--surface-2`; active = `scale(.98)` for 90 ms; focus =
  ring; disabled = see shared rules; loading = label stays for width, a 14 px spinner replaces the
  leading icon, `aria-busy`, clicks ignored.
- **A11y:** native `<button>`; toggle buttons use `aria-pressed`; icon-only buttons have
  `aria-label` plus a Tooltip.
- **UX map:** "Start call", "Create invite link", "Copy link", End confirm, every form submit.

### 3.2 Input

- **Anatomy:** label above (`--type-small` 600), field (40 px, `--surface`, 1 px
  `--border-control`, `--radius-control`), optional help text, error text.
- **Variants:** text, with leading icon (search), with trailing action (copy), read-only (invite
  link: `--surface-2`, mono text).
- **States:** hover border `--text-2`; focus ring + border `--focus`; invalid border `--danger`
  plus an error message with an icon; disabled `--surface-2`.
- **A11y:** `<label for>`; help and error linked with `aria-describedby`; `aria-invalid` on error;
  error text starts with what to do.
- **UX map:** "Your name", "Their name", invite link field.

### 3.3 Select

- **Anatomy:** native `<select>` styled like Input, chevron icon. No custom listbox in this round.
- **Variants:** default; `language` (see 3.8); `device` (mic/output).
- **States:** as Input.
- **A11y:** native semantics and typeahead; option text carries both names for languages.
- **UX map:** device selects in the mic check and More sheet, "Translation pace".
- Reason for native: works with screen readers and on mobile pickers with zero code.

### 3.4 Dialog (and Sheet)

- **Anatomy:** native `<dialog>`; title (`--type-h2`), body, actions row (secondary left,
  primary/danger right on desktop; stacked full-width on S). Backdrop `rgb(18 21 22 / 48%)`.
- **Variants:** `dialog` (centred, max 440 px, `--radius-window`, `--elev-3`); `sheet-bottom` (S:
  full width, top radius 8 px, safe-area padding); `sheet-side` (Technical details drawer, 400 px).
- **States:** enter = fade 160 ms + translateY 8 px (sheets: from the edge, 240 ms `--ease-out`);
  exit 120 ms `--ease-in`. Reduced motion: fade only.
- **A11y:** `showModal()` gives focus trap and Esc; `aria-labelledby` the title; focus returns to
  the trigger. End-call confirm focuses **Cancel** (UX spec §8.6).
- **UX map:** End confirm, leave-page confirm, More sheet, Technical details, invite sheet on S,
  mobile nav menu.

### 3.5 Tooltip

- **Anatomy:** small `--surface-elevated` label, `--type-small`, 6 px radius, `--elev-2`, no arrow.
- **Variants:** label tooltip (icon buttons), shortcut tooltip ("Mute · M").
- **States:** show on hover after 400 ms and on focus immediately; hide on Esc, blur, pointer
  leave. No motion beyond a 120 ms fade.
- **A11y:** the trigger keeps its own `aria-label`; the tooltip is `role="tooltip"` and referenced
  by `aria-describedby` only when it adds information (the shortcut). Never the only place
  information lives. Not shown on touch. Replaces `title=` attributes (audit §5).
- **UX map:** dock icon buttons, connection indicator ("Good connection").

### 3.6 Avatar

- **Anatomy:** circle (40 px default; 56 px on call cards; 32 px on S strip and transcript), initials
  (Manrope 600) on the identity tint, 2 px ring.
- **Variants:** `self` (teal), `other` (plum), `agent` (neutral, a small waveform glyph instead of
  initials), `placeholder` (dashed ring, for "Not joined yet").
- **States (ring):** listening = 2 px `--state-idle`; speaking = 3 px identity colour plus level
  (3.10); muted = dashed `--state-muted` ring plus mic-off badge; reconnecting = opacity .6 plus
  warning badge; left = greyscale initials, dashed ring.
- **A11y:** decorative (`aria-hidden`); the name next to it carries meaning.
- **UX map:** participant cards, transcript speaker, join screen ("Sam invited you").

### 3.7 Participant card

- **Anatomy (M+):** avatar; name (`--type-name`) with a "You" tag on the self card; language line
  "Speaks **English** `EN` → hears Korean · 한국어"; state row (icon + word + level meter);
  connection mini-meter only when poor/lost. Card: `--surface`, `--radius-surface`, 1 px
  `--border`, 3 px top rule in the identity colour.
- **Anatomy (S strip row, 56 px):** avatar 32 px, name, native language name, state word, meter on
  the right.
- **Variants:** `self`, `other`, `agent`, `placeholder` (not joined: dashed border, name and language
  from setup, "Not joined yet").
- **States:** listening (default, no motion); speaking (`--id-*-tint` background, `--elev-1`, ring
  and bars); hearing translation (lime chip "Hearing translation" + speaker glyph; bars from the
  local translation track); muted; weak connection (warning chip); reconnecting (whole card .6
  opacity, meters frozen); left ("Left the call", greyed); joining (skeleton lines).
- **Hover/focus:** cards are not interactive. In agent test mode they may link to Technical details;
  then the whole card is a button with a visible focus ring.
- **A11y:** `<article aria-label="Ji-woo, speaks Korean, hears English, listening">`; the label
  updates on state change but the card is **not** a live region (UX spec §8.4). State words are
  real text, not colour only.
- **Rendering:** the card re-renders only when its *state* changes. The level is written to a CSS
  variable by ref (3.10), never through React state.
- **UX map:** §5.2 participant representation; states Listening, Speaking, Muted, Network degraded,
  Reconnecting, Other person left, Waiting.

### 3.8 Language selector

- **Anatomy:** label ("I speak" / "They speak"); native select; each option "Korean · 한국어"; a
  `KO` mono chip shown beside the closed select; a Swap icon button between the two selectors.
- **Variants:** `setup` (editable), `readonly` (in call and invite panel: text plus chip, no
  select), `checkbox-list` (agent form; keeps the "Russian" checkbox name the tests use).
- **States:** as Select; the other selector's language is removed from the options (backend rejects
  equal languages); swap rotates its icon 180° in 160 ms (none under reduced motion).
- **A11y:** option text includes the English and native names so typeahead works in both; the
  native name span has `lang`; Swap has `aria-label="Swap languages"` and announces the result via
  the page's status line ("Now: you speak Korean, they speak English").
- **UX map:** §4.1 setup, §4.2 invite, §4.3 join screen.

### 3.9 Interpreter bridge

- **Anatomy:** a horizontal track between the two cards (M+) or a single line under the strip (S):
  line (2 px), arrowhead pointing to the listener, a label chip below ("Translating into English"),
  and optional packet (8×2 px lime segment) that moves along the track.
- **Variants:** `horizontal` (desktop/tablet, 64–96 px wide), `inline` (S: one row "→ Translating
  into Korean" with a 48 px mini track).
- **States:**

  | State | Line | Arrow | Label | Motion |
  | --- | --- | --- | --- | --- |
  | Starting | dashed `--state-idle` | none | "Interpreter starting…" | none (the status line explains) |
  | Ready | solid `--border-strong` | none | "Ready" | none |
  | Translating (inferred) | solid `--interp-ink`, `--interp-tint` behind | toward listener | "Translating into {lang}…" | packet travels toward listener, 1.4 s loop, only while state holds, max 6 s |
  | Speaking translation | solid, 3 px, `--interp` (dark) / `--interp-ink` (light) | toward listener, filled | "You're hearing Ji-woo in English" / "Ji-woo is hearing you in Korean" | arrow end shows a 3-bar level from our own translation track (only when the listener is us) |
  | Interpreter reconnecting | dashed `--warning` | none | "Interpreter reconnecting…" | none |
  | Unavailable | dashed `--danger` | none | "Interpreter isn't responding" | none |

- **A11y:** `role="img"` with `aria-label` equal to the label text; not live (the status line and
  transcript carry announcements). Direction is in the words, not only the arrow.
- **UX map:** §5.1 Bridge, §5.2 interpreter states, §5.3 Translating, Speaking translation,
  Interpreter starting/unavailable.

### 3.10 Audio state (level meter)

- **Anatomy:** 5 vertical bars, 3 px wide, 2 px gap, 16 px tall (card) or 12 px (strip,
  transcript). Bars use `transform: scaleY()` only.
- **Implementation (cheap, no canvas):**
  1. One `LevelStore` per call (plain object with `subscribe`), outside React.
  2. **Local mic:** an `AnalyserNode` on the local mic track (reuse `voice-input.ts`), read inside a
     `requestAnimationFrame` loop that **samples at most every 50 ms (≤ 20 Hz)** and runs only
     while the local participant is unmuted and in `activeSpeakers`, or for 600 ms after the last
     non-zero level. Otherwise the loop stops completely.
  3. **Remote / interpreter:** `participant.audioLevel` delivered with `ActiveSpeakersChanged`
     (server rate, roughly 2–3 Hz). No extra loop; a 120 ms linear CSS transition smooths steps.
  4. **Translation playback level** (our own track only): an `AnalyserNode` on the attached
     translation track, same ≤ 20 Hz rule, used by the bridge and "Hearing translation".
  5. The store writes `el.style.setProperty('--level', value.toFixed(2))` on the meter element
     via ref. Each bar: `transform: scaleY(calc(.15 + var(--level) * var(--w)))` with weights
     `--w` .55/.8/1/.8/.55. No React re-render per sample.
  6. When the level stays under 0.02, the store writes 0 once and stops.
- **Variants:** `self` (teal), `other` (plum), `interp` (lime/olive), `binary` (no level data: bars
  at a fixed mid shape, a 1.2 s ease-in-out opacity "breath" only while speaking).
- **States:** idle (bars at 15 %, `--state-idle`); active (identity colour); muted (meter hidden,
  mic-off icon shown); frozen (reconnecting: last value, .5 opacity).
- **Reduced motion:** no continuous scaling. The meter becomes a static 3-step indicator (low,
  mid, high) that changes only when the bucket changes, and at most every 500 ms.
- **A11y:** `aria-hidden`; the state word next to it ("Speaking") is the accessible signal.
- **UX map:** §5.3 Speaking (you / other), Speaking translation; §4.1 mic check ("We hear you").

### 3.11 Connection state

- **Anatomy:** header indicator: 3 ascending bars (4/7/10 px) + word ("Good connection", "Weak
  connection", "Reconnecting…", "Offline"). Card mini-meter: the bars only, shown only when poor
  or lost.
- **Variants:** `header`, `card-mini`, `banner` (reconnecting: full-width `--warning-tint` bar under
  the header with icon and text).
- **States:** excellent/good = 3 bars `--success`, word hidden on S; poor = 1 bar `--warning`;
  lost = 0 bars + `--danger` outline; reconnecting = bars replaced by a 12 px ring spinner (1 s
  rotation; reduced motion: static ring with a gap) + banner.
- **A11y:** the word is text (visually hidden on S, still in the accessible name); changes are
  announced only through the page status line (self connection only, UX spec §8.2).
- **UX map:** §5.3 Network degraded, Reconnecting; §5.1 call header.

### 3.12 Transcript line (original speech)

- **Anatomy:** a row in a `role="log"` list. Left: 3 px rule in the speaker's identity colour.
  Header: speaker name (identity colour, `--type-small` 600) · time (`--type-label`, tabular).
  Body: the text.
- **Variants:**
  - `primary` (text in the viewer's language: `--type-body-lg`, `--text`);
  - `secondary` (the other language: `--type-body-sm`, `--text-2`, with a `KO` chip);
  - `agent` (agent tests: neutral rule, chat layout as today).
- **States:** new = fade in + translateY 6 px over 240 ms `--ease-out` (reduced motion: none);
  pending (original without translation yet): "Translating…" line under it in `--interp-ink` with
  a 3-dot static glyph (no animation; the bridge already animates); timed out: "No translation
  received" in `--text-muted`; hover: `--surface-2` background (shows a copy action on desktop).
- **A11y:** each text node has `lang`. Only the other person's completed line in the viewer's
  language is announced (UX spec §8.3). Names are text, so colour is never the only cue.
- **UX map:** §5.4 transcript presentation, pending, perspective rule.

### 3.13 Translation line

- **Anatomy:** sits directly under its original inside the same row. Prefix label (`--type-label`):
  "Translated" (for the other person's speech, where this is the primary line) or "What Ji-woo
  heard" (for your own speech, secondary). A thin `--interp-ink` 2 px tick marks it as interpreter
  output.
- **Variants:** `primary` (other person's speech: the translation is shown big and the original
  becomes the secondary line above it), `secondary` (your speech), `unpaired` (translation with no
  matched original: shown alone with "Translation" label).
- **States:** arrives = the pending line cross-fades into the translation (160 ms); reduced motion:
  instant swap. "Pairing by order" note lives in Technical details only.
- **A11y:** `lang` set; when it is the primary line for the viewer it is the text the log announces
  ("Ji-woo: What time is the meeting tomorrow?").
- **UX map:** §5.4 perspective rule and pairing.

### 3.14 Provider selector

- **Anatomy:** a labelled native select per layer (Speech-to-text, Language model, Text-to-speech)
  inside a collapsed "Advanced: providers" `<details>`. Each option: provider name, model in mono.
  A one-line help text: "Runtime default is used when not set."
- **Variants:** `form` (agent form), `readonly` (Technical details: definition list with mono
  values).
- **States:** unsupported providers are disabled options with "(not supported by runtime)"
  (existing allow-list); changed fields show a small "Changed" chip (provider ids are only sent
  when changed, as today).
- **A11y:** keep the exact labels "Speech-to-text provider", "Language model provider",
  "Text-to-speech provider" (tests).
- **UX map:** §6 agent form "Providers (collapsed Advanced)"; layer C.

### 3.15 Call control and mobile control bar

- **Anatomy (dock, M+):** a bar at the bottom of the call layout (`--surface-elevated`, `--elev-1`,
  top border). Left group: Mic toggle, Output (popover), Invite (creator until guest joins),
  Transcript (M only), More (⋯). Right, separated by space: **End call** (`danger`, label always
  visible). Buttons 48 px tall with icon + label.
- **Anatomy (S, mobile bar):** fixed bottom, `padding-bottom: env(safe-area-inset-bottom)`, three
  slots: More (48 px, left) · **Mic** (64 px circle, centre) · **End** (48 px, red, right). Labels
  under the side buttons at 12 px; the mic label is the state word under it ("Mute"/"Unmute").
- **Mic states:** on = `--surface` with mic icon and label "Mute"; off = `--text` fill with slashed
  mic icon, `--bg` text, label "Unmute", `aria-pressed="true"`; disabled while connecting (shown
  with spinner and "Connecting"). Pressing gives 90 ms scale .96.
- **End:** opens the confirm dialog; no keyboard single-key shortcut.
- **A11y:** container `role="toolbar" aria-label="Call controls"` with arrow-key roving focus;
  shortcuts M / T / D listed in Tooltips and the More sheet; End is visually and spatially separate.
- **UX map:** §5.1 Control dock, §5.5 controls, §7.1 dock per breakpoint.

### 3.16 Status indicator

- **Anatomy:** dot (8 px) + word, or chip (24 px tall, pill, tint background, icon + word).
- **Variants:** `live` (`--success` dot; no pulse), `ended` (neutral), `failed` (`--danger`),
  `waiting` (`--warning` hollow dot), `soon` (replaces "Coming soon": neutral outline chip, used
  only outside the call dock), `kind` ("Call" / "Agent test").
- **States:** static; a status change swaps the chip with a 160 ms cross-fade.
- **A11y:** the word is always present; the dot is `aria-hidden`.
- **UX map:** conversation rows ("Live", "Ended", "Failed"), header "Invited · waiting for Ji-woo",
  agent cards.

### 3.17 Toast

- **Anatomy:** pill-to-rounded box (`--surface-elevated`, `--elev-2`, `--radius-window`), icon,
  one sentence, optional single action ("Undo", "Copy again"). Bottom-centre above the dock on the
  call screen; bottom-right in the workspace.
- **Variants:** `info`, `success` ("Link copied"), `warning`, `error` (non-blocking only).
- **States:** enter translateY 8 px + fade 200 ms; auto-dismiss after 4 s (paused on hover/focus;
  never auto-dismiss if it has an action, until 8 s); exit 140 ms.
- **A11y:** toasts are **not** a second live region. Their text is sent to the page's single status
  line; the toast is the visual. Blocking errors are never toasts; they are inline alerts.
- **UX map:** "Link copied", "Microphone switched to AirPods", "Session saved".

### 3.18 Empty state

- **Anatomy:** small line illustration in `--text-faint` (optional, inline SVG, ≤ 1 KB), title
  (`--type-h3`), one sentence, one primary action.
- **Variants:** `page` (centred in the content area), `panel` (inside a card, left-aligned).
- **A11y:** plain text; the action is a real button/link.
- **UX map:** "No conversations yet." + **Start a call** (tested text kept); empty transcript in a
  live call ("When someone speaks, their words and the translation appear here."); no ready voices
  (hidden, per spec).

### 3.19 Loading state

- **Anatomy:** skeleton blocks in `--surface-2` matching the final layout (rows, cards), or a
  single progress line for multi-step actions ("Preparing interpreter…" → "Connecting audio…").
- **Variants:** `skeleton`, `inline` (spinner 14 px + text), `steps` (call start: step text plus a
  3-dot step indicator showing which of 3 steps is active).
- **States:** skeleton shimmer is **off**: skeletons are static, with a 1.6 s opacity breath
  (.6 ↔ 1) only after 800 ms of waiting. Reduced motion: static.
- **A11y:** container `aria-busy="true"`; one `role="status"` text ("Loading conversations…"),
  never several.
- **UX map:** §4.1 [L] start steps, §4.5 skeleton rows, agent edit load.

### 3.20 Error state

- **Anatomy:** icon (danger), title in plain language, one sentence on what to do, primary
  recovery action, "Technical details" disclosure with the raw code/message.
- **Variants:** `inline` (next to the control: mic denied), `banner` (call-level: "Tap to turn on
  sound", reconnecting failure), `page` (platform unreachable, 404).
- **States:** appears without motion (errors should not bounce). Retry buttons use Button
  `loading`.
- **A11y:** blocking errors use `role="alert"` (keep the playground's playback alert); form errors
  linked by `aria-describedby`; focus moves to the error only when the user's action caused it.
- **UX map:** §4.1–4.3 error branches, §5.3 Sound blocked, Interpreter unavailable, Ended with
  "Retry end call".

---

## 4. Realtime state visual language

One table for the whole call screen. "Colour" is the main colour token; every state also has an
icon and a word, so nothing depends on colour alone. Screen-reader text is what goes into the
single status line (call-level) or the card's accessible label (person-level, not announced).

| State | Colour | Shape / icon | Motion | Reduced-motion fallback | Screen-reader text |
| --- | --- | --- | --- | --- | --- |
| **Connecting** | `--text-2`, cards `--surface-2` skeleton | Placeholder avatars, connection ring spinner in header | Header ring spinner 1 s rotation; skeleton breath after 800 ms | Static ring with gap; static skeleton | Status: "Connecting to the call…" (once) |
| **Waiting for other person** | Other card dashed `--border-control`; invite panel accent `--primary` | Placeholder avatar (dashed ring), "Not joined yet" | None | Same | Status: "Waiting for Ji-woo to join." |
| **Listening** | `--state-idle` | Solid 2 px ring, bars at rest, ear-less: just the word | None | Same | Card: "…, listening" (not announced) |
| **Speaking** (you / other) | `--id-self` / `--id-other`, card tint | 3 px ring in identity colour, 5 level bars | Bars follow the real level (≤ 20 Hz local, server rate remote); card tint fades in 160 ms | 3-step static meter, changes ≤ every 500 ms; no tint fade | Card: "…, speaking" (not announced) |
| **Translating** (inferred) | `--interp-ink` line on `--interp-tint` | Bridge arrow toward listener; pending line under the original | One packet travels the bridge toward the listener, 1.4 s linear loop; stops when the state ends or after 6 s | Static filled arrow plus "…" glyph | Bridge label: "Translating into English" (not announced; the translation itself is announced when it arrives) |
| **Speaking translation** | `--interp` / `--interp-ink`, listener chip lime fill | Solid 3 px bridge, filled arrowhead, "Hearing translation" chip with speaker icon on the listener's card | Level bars at the arrow end from *our* translation track only | Static 3-step meter | Bridge label: "You're hearing Ji-woo in English" |
| **Muted** | `--state-muted` | Mic-off icon on avatar badge and in the dock; dashed ring; meter hidden | Icon swap 120 ms fade | Instant swap | Status (self only): "You're muted." / "Microphone on." |
| **Reconnecting** | `--warning`, banner `--warning-tint` | Header ring spinner; cards at .6 opacity; meters frozen | Spinner rotation 1 s; 240 ms dim | Static ring, instant dim | Status: "Reconnecting…" then "Reconnected." |
| **Network degraded** | `--warning` | 1 of 3 connection bars; "Weak connection" chip on the affected card | None (chip fades in 160 ms) | Instant | Status (self only): "Your connection is weak; translation may lag." |
| **Ended** | Neutral `--text-2`; summary on `--surface` | Cards collapse into the summary; bridge removed | 360 ms fade/scale .98 out of the call, summary fades in | Instant swap | Status: "Call ended." Focus moves to the summary heading |

Supporting states from the UX spec, same rules:

| State | Treatment |
| --- | --- |
| Interpreter starting / unavailable | Bridge dashed (`--state-idle` / `--danger`), words only; no motion. |
| Sound blocked | `--danger-tint` banner "Tap to turn on sound", `role="alert"`, primary button. |
| Other person left | Their card greyscale with "Left the call"; End call gets `--elev-1`. Status: "Ji-woo left the call." |
| Barge-in (both speaking) | Both cards show Speaking; the bridge keeps its current state. No special effect: two active meters already show the overlap. |

---

## 5. Animation principles

### 5.1 Tokens

```css
--dur-instant: 90ms;   /* press feedback, meter transitions */
--dur-fast: 180ms;     /* hover, focus, chip swap, icon swap   (= --motion-fast) */
--dur-base: 240ms;     /* transcript row in, sheet in, card tint (= --motion-standard) */
--dur-slow: 360ms;     /* join/leave, call → ended */
--dur-loop: 1400ms;    /* bridge packet loop */
--ease-standard: cubic-bezier(.2, .7, .2, 1);  /* existing */
--ease-out: cubic-bezier(.22, 1, .36, 1);      /* replaces both --ease-expo copies */
--ease-in: cubic-bezier(.4, 0, 1, 1);          /* exits */
--ease-linear: linear;                         /* meters, packet */
```

### 5.2 What animates

Only things that mirror a real change:

- Level meters (real audio level).
- The bridge packet (inferred translating) and the bridge level (our translation track).
- Participant join/leave (card from placeholder to live: 360 ms fade + ring draw).
- Transcript rows appearing (fade + 6 px).
- Pending → translated line cross-fade.
- Connection transitions (bars change, banner slides 8 px).
- Language swap icon, sheet/dialog enter and exit, press feedback.

### 5.3 What never animates

- Anything while idle: no breathing orbs, no ambient background, no canvas on call routes
  (`DashboardBackground` must not render on `/call` and `/join`).
- Text content: no typewriter, no number count-up on live data.
- Colour-only pulses on End call or errors.
- Layout properties (`width`, `height`, `top`, `left`, `box-shadow`, `filter`): only `transform`
  and `opacity` animate.
- Scroll: no smooth-scroll library, no scroll-linked effects in the app. "Jump to latest" uses
  `scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" })`.

### 5.4 Performance budget (call screen)

| Budget | Limit |
| --- | --- |
| Infinite CSS animations running at once | ≤ 2 (header spinner and bridge packet never both in steady state) |
| JS sampling loops | ≤ 2 (local mic, own translation track), each ≤ 20 Hz, **stopped when silent** |
| React renders per second during speech | Participant card renders only on state change; 0 renders per level sample |
| Main-thread long tasks during a call | 0 tasks > 50 ms caused by UI |
| Canvas / WebGL | none on call routes |
| Animation libraries | none in the app area (`gsap`, `animejs`, `lenis` stay landing-only) |
| Call screen CSS | target ≤ 12 KB gzip in its own route-group stylesheet |
| New fonts | Noto Sans KR only, `preload: false`, unicode-range slices |

### 5.5 Reduced motion

A single block in `tokens.css`:

```css
@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur-base: 0ms; --dur-slow: 0ms; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
}
```

The JS side reads `matchMedia('(prefers-reduced-motion: reduce)')` once in the level store and
switches to the 3-step, ≤ 2 Hz meter. The theme circular reveal should also check it (the audit
could not verify this in `theme-toggle.tsx`).

**Animation libraries in the app area: not needed.** Every motion above is a CSS transition or
keyframe on `transform`/`opacity`, plus one ref-driven CSS variable.

---

## 6. Layout grid and breakpoints

Breakpoints (UX spec §7):

| Name | Width | Gutter | Grid |
| --- | --- | --- | --- |
| **S** | < 640 px | 16 px | 4 columns, 12 px gaps |
| **M** | 640–1023 px | 24 px | 8 columns, 16 px gaps |
| **L** | 1024–1279 px | 32 px | 12 columns, 24 px gaps |
| **XL** | ≥ 1280 px | 40 px | 12 columns, 24 px gaps, content max 1200 px (workspace) |
| Short landscape | height < 500 px | — | Call: people strip and dock shrink; transcript stays |

Media queries use `width` ranges: `@media (width < 640px)`, `(640px <= width < 1024px)`, etc.

**Call screen** (`100dvh`, no page scroll; only the transcript scrolls):

```
XL/L:  grid-template-columns: minmax(560px, 1fr) var(--transcript-w);   /* 400 px XL, 320 px L */
       grid-template-rows: 56px 1fr auto;                                /* header / main / dock */
       areas: "header header" "people transcript" "dock dock"
       people: [card 1fr] [bridge 96px (L: 64px)] [card 1fr], max 880 px, vertically centred
M:     rows: 56px auto 1fr auto  → header / people row (cards + 56 px bridge) / transcript / dock
S:     rows: 48px auto 1fr auto  → header (pair + dot) / strip (2×56 px rows + bridge line 32 px) /
       transcript / mobile bar (72 px + safe area)
```

**Workspace pages:** header 64 px (S 56 px); content in the 12-column grid; list pages single
column ≤ 960 px wide; detail pages 8/4 split at L+, stacked below. Setup and Join: one column,
max 520 px, at every size; on S the primary button is sticky above the safe area.

**Touch targets:** ≥ 44×44 px; mic 64 px on S. Minimum distance between Mic and End on S: 48 px.
