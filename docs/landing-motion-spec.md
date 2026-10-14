# Landing page design and motion specification

Scope: the public marketing site under `app/(marketing)`. Product/dashboard routes are untouched.
Updated 14 October 2026 after the polish pass (see `docs/landing-polish-plan.md`).

Principle: **restraint.** Every animation has to answer "why does this exist?" Server-rendered sections only
carry `data-*` attributes; one client controller (`LandingMotion`) owns smooth scroll, section sequences,
parallax, counters and ambient scroll. Only genuinely interactive pieces (showcase tabs, comparison rows,
gallery pause, conversation preview) are client components.

## Stack decisions

| Need | Choice | Why |
| --- | --- | --- |
| Scroll-scrubbed / pinned choreography | GSAP + ScrollTrigger | Anime.js could not express pin + scrub + progress cleanly. |
| Smooth scrolling | Lenis, synced to GSAP's ticker | One RAF loop; ScrollTrigger reads the same scroll position. |
| Infinite/ambient loops, marquee, hover | CSS | No JS cost; trivially paused. |
| Hero orb | Anime.js | Scoped, reduced-motion aware; its endless loops pause when the hero is off-screen. |
| Fonts | `next/font` (Manrope, DM Sans, DM Mono; Latin + Cyrillic for Manrope) | Self-hosted, no render-blocking CSS `@import`. |
| Styling | Plain CSS (`app/globals.css`, `motion.css`, `theme-dark.css`) | The project has no Tailwind; do not add a second styling system. |

Not added: Tailwind, Framer Motion, Lucide, WebGL. One 2D canvas (the hero network, shared with the dashboard) is the only canvas.

## Design tokens (`:root` in `globals.css`)

| Group | Tokens |
| --- | --- |
| Colour | `--paper`, `--paper-2`, `--surface`, `--ink`, `--ink-2` (secondary text, ≥ 4.5:1), `--ink-3` (large italic only), `--line`, `--line-strong`, `--band` / `--band-ink` / `--band-ink-2` / `--band-line` (dark bands), `--accent` (glows, marks), `--accent-dark` (arrows, large glyphs), `--accent-text` (small coral text, ≥ 4.5:1), `--accent-button`, `--signal` |
| Accent meaning | Coral = the human voice and the primary action. Signal lime = live signal only (waveforms, live chips, selected emphasis). |
| Type | `--text-display` (hero), `--text-h2-lg` (closing), `--text-h2` (default), `--text-h2-sm` (capabilities, comparison, gallery, numbers), `--text-lead` 17, `--text-body` 15, `--text-small` 13, `--text-label` 11. Nothing in the marketing page is below 11px. |
| Section spacing | `--section-xl` 150 (hero-scale, closing), `--section-l` 120, `--section-m` 96, `--section-s` 64; 96 / 80 / 64 / 48 at ≤ 720px. |
| Product surfaces | `--radius-window` 6, `--radius-row` 4, `--radius-control` 3; one layered `--shadow-window`, used only for product windows. |

## Layers

1. **Environment** (fixed, `AmbientBackground`): faint grid and film grain, both hidden below 900px.
2. **Ambient light** (fixed): one coral glow drifting 48 s; scroll drift −90 px over the document.
3. **Section ambience** (local, CSS): one quiet glow per section; the showcase also gets a perspective floor.
   The hero's glow fades out at its bottom edge so it never ends in a hard line.
4. **Content**: sequences, pinned showcase, counters.

Speeds are deliberately different: grain static · glow very slow (40–90 s) · showcase scrubbed to scroll ·
content 0.8 s entrances. Removed: floating rings/lines/dots, a second glow, hero/closing rotating rings, the
pointer-following glow, the cursor spotlight edges. Loops are CSS (compositor-only); no `filter: blur`
glows, no blend-mode layers over the viewport.

## Page structure and treatments

| Section | Treatment | Spacing | Motion |
| --- | --- | --- | --- |
| Header | Transparent at top → paper + blur + hairline after 16 px (CSS, 300 ms). Mobile menu is a native disclosure. | – | – |
| Hero | Asymmetric copy / orb. Constrained text, no section label. | xl | CSS entrance once. Orb parallax on exit (desktop). Code-switch headline phrase: English → Russian → Kyrgyz → Kazakh → Korean, 5 s hold, paused off-screen and in hidden tabs. |
| Signal (dark band) | Product preview leads, copy beside it. | l | One sequence: eyebrow + preview, intro, detail. Headline uses the masked word reveal (desktop). Tab switch cross-fades the conversation. |
| Capabilities | Editorial list, smaller headline, left-aligned. | m | One sequence: heading → intro → rows. Row hover changes background and arrow only. |
| How it works (pinned showcase) | Wide product window; absorbs the former "process" steps as its three tabs. | m | Entrance scrubbed on approach (scale, y, rotateX, clip-path); pinned ≈ 2.4 viewports, progress selects Agents / Playground / Conversations; tab click scrolls to its segment. **< 900 px wide, < 640 px tall or reduced motion:** no pin; tabs switch by state. |
| Numbers (dark band) | Compact band; the numbers carry it (headline is screen-reader only). | m | Sequence + counters count up once at 85% (final value in SSR markup). |
| Comparison | Dense, interactive rows. | l / m | One sequence; rows expand on click/Enter (`grid-template-rows` 0fr → 1fr, 320 ms). |
| Screens (dark band) | The only edge-to-edge section. 8 illustrative panels with real labels and values. | m | CSS marquee (70 s), pause button, pauses on hover. **Touch:** native swipe strip with snap, no marquee. Reduced motion: native scroll. |
| Closing | Centered, largest headline; one quiet line of example use cases; ghosted product window behind. | xl | Headline word reveal (desktop), sequence for the rest, window parallax ±50 px (desktop). The ghost window is hidden on phones. |

Alternating light / dark bands give the page its rhythm: product (dark) → feature (light) → product (light,
pinned) → data (dark) → interactive (light) → screens (dark) → close (light).

## Motion system

- **Sequences:** a section marked `data-sequence` owns one GSAP timeline; its `data-step="N"` children enter
  in step order (visual, headline, supporting, secondary), steps 0.14 s apart, elements within a step 0.08 s
  apart. `data-step-from="scale|fade"` changes the entrance. Starts when the section top reaches 72% of the
  viewport, once.
- **Entrance:** `opacity 0→1`, `y 20→0`, 0.8 s, `expo.out` (one shared ease). No bounce or spring.
- **Headline reveal:** `SplitText` masked word rise on exactly two headings (signal, closing); on < 900 px a
  plain fade instead.
- **Desktop-only (≥ 900 px, motion allowed):** parallax (`data-parallax`, `data-parallax-exit`,
  `data-scroll-fade`), fixed-layer scroll drift (`data-ambient-depth`), the masked headline reveal.
- **Scrub:** `scrub: 0.6` on the pinned sequence; `scrub: true` on parallax.
- **Hover vocabulary:** background / border / opacity changes, `translateY(-2px)` on buttons only. No scale
  on content, no layout-affecting hover (no padding or size changes).
- Only `transform`, `opacity` and `clip-path` animate, except the comparison disclosure.

## Mobile and touch

- Header menu is native `<details>`; on coarse pointers every interactive target is ≥ 44 px.
- No pin, no parallax, no marquee, no SplitText, no grain or grid; ambient loops are off below 900 px. The hero's
  language wave animates the four words rather than ~20 letters, and the orb no longer animates the orbit rings,
  nodes and trace that phones hide. Motion is event-driven: a burst every few seconds, or a tap.
- **Plain on phones (≤ 720 px):** no orbit tags (EN / RU / Illustrative), orbit rings or arrow glyphs; section labels are
  sentence-case sans instead of tracked mono capitals; capability rows lose their numbers and arrows; stats become a
  number + label list; the primary hero button is full width. Copy is shared with desktop and kept literal: say what the
  product does, no slogans.
- Product windows crop rather than shrink: the showcase sidebar becomes a 52 px icon rail, the languages
  column and duplicate chips are dropped; text stays ≥ 11px.

## Accessibility and fallback

- `prefers-reduced-motion`: no Lenis, no GSAP sequences/scrub/pin/counters (final values shown), no ambient
  loops, no code-switch rewriting, marquee becomes a scrollable strip, tabs switch without movement.
  Verified: 0 running animations, no pin.
- Content is fully visible without JS (reveal start states are applied by JS only).
- Decorative layers: `aria-hidden`, `pointer-events: none`.
- Tabs follow the WAI-ARIA tabs pattern (roving tabindex, arrow keys, `inert` on hidden panels).
- Small text meets 4.5:1 in both themes (checked with an automated contrast walk); the only remaining
  flags are text over gradients the checker cannot resolve (hero core mark) and the logo dot.
- One `h1`; sections use `h2`; the numbers band has a screen-reader-only `h2`.

## Honesty rules (carried over from the existing page)

- Every product visual is labelled illustrative; no real-looking screenshots of unbuilt features.
- Numbers are product facts taken from the page copy (3 provider layers, 2 languages in one conversation,
  1 workspace), not usage metrics. Replace with real adoption data when it exists.
- No testimonials: there are no real quotes to show, and invented ones would be fabricated.
- The comparison names a category ("scripted voice menus"), not specific competitors.
- Sample agent and session names in the product windows are placeholders, labelled illustrative.

## Theming (light / dark)

- Scope: `html[data-vl-theme="dark"] .marketing-root`; the product routes keep their own themes.
- Default follows `prefers-color-scheme`; the header switch (`role="switch"`) stores the choice in
  `localStorage` (`vl-theme`). An inline script in the **root** layout's `<head>` sets `data-vl-theme` on
  `<html>` before first paint, and `ThemeToggle` re-applies it on mount.
- `theme-dark.css` redefines the tokens (`--ink`, `--ink-2`, `--paper`, `--paper-2`, `--band`, `--shadow-window`,
  …) and overrides only what tokens cannot express (art, ambience, product-window internals).
- Switching fades colours for 450 ms (class `theme-transition`, removed afterwards so it never competes
  with GSAP transforms).

## Signature details

| Detail | How it works | Fallback |
| --- | --- | --- |
| Circular theme reveal | `ThemeToggle` uses the View Transitions API and animates `clip-path: circle()` on `::view-transition-new(root)` from the button's centre. Scoped by `html.theme-vt`. User-initiated, so it earns its motion. | No API support or reduced motion: 450 ms colour fade. |
| Masked headline reveal | `data-split` headings use GSAP `SplitText` (`lines,words`, `mask: "lines"`, `autoSplit`). Signal and closing only. | < 900 px: fade. Reduced motion: untouched. |
| Hero code-switch | `CodeSwitch` cycles the italic phrase through English, Russian, Kyrgyz, Kazakh and Korean as a wave: the letters lift away left to right (0.42 s, `power2.in`, 20 ms apart), the text and colour swap, and the next phrase rises in on a second wave (0.7 s, `power3.out`, 30 ms apart). Words stay whole, letters are separate boxes. Each language takes its flag colours (`--lang-a` / `--lang-b` per `data-lang`; lighter on dark): English blue; Russian blue then red (white is omitted, it is unreadable on paper); Kyrgyz red then yellow; Kazakh sky blue; Korean the taegeuk red→blue blended letter by letter (`--p`), upright. Two-colour flags split the words across their colours (`data-b`). The h1 reserves its tallest state so nothing below it moves; phrases are short enough that no word wraps. | Static English; screen readers always get the English phrase. |
| Hero network | The dashboard's node field (`HeroNetwork`, a canvas inside `.hero-stage`) behind the hero: dimmed under the headline block, coral signals travel in to the orb and it answers with rings that leave its edge. Pauses off-screen and in hidden tabs; one still frame under reduced motion. **Phones:** no running loop. One signal and the orb's answer play as a ~3 s burst every 4.5–6.5 s (nothing is drawn in between), or immediately when the orb is tapped (`vl:orb-ping`, plus a one-off swell of the orb). Low-end devices (≤ 4 cores, < 4 GB), data-saver and reduced motion keep the still frame. Canvas resolution is capped at 1.5× on phones. | Still frame. |
