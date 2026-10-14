# Landing polish plan

Drafted 14 October 2026. Scope: the marketing page (`app/(marketing)`, `components/features/landing`,
marketing rules in `app/globals.css`). Product routes are out of scope. Goal: **more intentional, not more
impressive** — every phase removes or consolidates before it adds.

## Audit (current state)

| Area | Finding | Where |
| --- | --- | --- |
| Section sameness | All 8 sections open with the same `NN / TITLE` eyebrow + mono aside + large `h2` with an italic second line. Reads as one template repeated. | `landing-page.tsx` |
| Duplicated content | 02 Process (Shape / Talk / Learn) says the same thing as 04 Showcase (Configure / Test live / Review). | `landing-page.tsx`, `workspace-showcase.tsx` |
| Too many sections | 10 blocks (hero, 01–08, closing); use cases and stats are thin and could be absorbed. | `landing-page.tsx` |
| Typography | No scale: each section sets its own `h2` clamp (38–56 → 57–100px). Body copy is 12–14px; asides 9–10px. Product-mock text is 5–10px, which is not believable at any zoom. | `globals.css:102–187`, `:149–175` |
| Spacing | One-off paddings (126, 130/140, 115/129, 93, 90/95px); no rhythm intent. | `globals.css` |
| Color | Many hardcoded hexes per section (`#202425`, `#e9e9df`, `#afb2ad`, `#858781`, `#696c66`…) instead of tokens; dark theme has to re-override each one. Small mono asides (`#858781` on paper) are likely below 4.5:1. | `globals.css`, `theme-dark.css` |
| Motion volume | Every heading has the SplitText word reveal; eyebrows, intros and buttons each reveal independently. | `landing-page.tsx`, `landing-motion.tsx` |
| Decoration | Coral→lime gradient spotlight edges and the global pointer glow are "because we can" effects. | `motion.css:288–291`, `ambient-background.tsx` |
| Hover | Tags lift on hover, gallery media magnify 1.06 — hover motion on non-primary elements. | `motion.css:55–56`, gallery |
| Performance | Google Fonts loaded via CSS `@import` (render-blocking, 11 weights). | `globals.css:1` |
| Docs | `landing-motion-spec.md` still describes removed floating shapes, second glow, rings and scroll cue. | `docs/landing-motion-spec.md` |

Already good and kept: one sparse ambient layer, consistent ease-out, transform/opacity-only animation, full
reduced-motion path, honesty rules (illustrative visuals, no fake testimonials or metrics).

## Target page structure

Beginning → middle → end, each section with one distinct treatment, spacing tier and (at most) one motion idea.

| # | Section | Treatment | Spacing | Motion (why) |
| --- | --- | --- | --- | --- |
| 1 | Hero | Asymmetric copy / orb, constrained text | XL | CSS entrance once; orb is the only live element; code-switch shows the product's core idea |
| 2 | Signal (dark band) | Product preview leads, copy beside it | L | One timeline: preview establishes → copy follows. Tab switch = product demo |
| 3 | Workspace (pinned) | Wide product window; **absorbs Process steps** into its three tabs | L | The page's one signature scroll sequence |
| 4 | Capabilities | Editorial list, left-aligned, smaller `h2` | M | Static rows; one group reveal |
| 5 | Numbers (dark band) | Compact inline band, not a full section | S | Counters only |
| 6 | Comparison | Dense, interactive, tight | M | Row disclosure (user-driven) |
| 7 | Screens | The only edge-to-edge section | M | Horizontal marquee (spatial: "there is more") |
| 8 | Closing CTA | Centered, largest headline; **absorbs use-case tags** as one quiet line | XL | Headline reveal + window parallax |

Section numbering (`01 / …`) is dropped; eyebrows stay only where they carry information (e.g. "Illustrative
panels, not live data").

## Status

- Phase 1 (tokens, `next/font`): **done** 14 Oct 2026.
- Phase 2 (structure): **done**. Process folded into the showcase tabs, use cases folded into the closing,
  numbering removed, numbers band compacted. Resulting order: hero → signal → capabilities → workspace
  (pinned) → numbers → comparison → screens → closing, alternating light/dark bands.
- Phase 3 (motion): **done**. One `data-sequence` timeline per section (replaces ~20 independent reveals);
  SplitText only on the signal and closing headlines; spotlight edges, pointer glow, capability-row padding shift
  and gallery magnify/lift removed; code-switch slowed to a 6 s hold and paused off-screen.
- Phase 4 (product UI): **done**. Showcase window has a real toolbar (breadcrumb + preview label), SVG nav icons,
  table-style agent/session rows and a playground control bar; all window text ≥ 11px; one layered
  `--shadow-window`, `--radius-window` / `--radius-row` tokens; gallery panels carry real labels and values;
  mobile crops to an icon rail instead of shrinking type.
- Phase 5 (mobile): **done**. 44px touch targets on coarse pointers; all text ≥ 11px; gallery is a native swipe
  strip on touch; no grain/grid/ambient loops below 900px; parallax, fixed-layer drift and SplitText are
  desktop-only (phones get a plain fade); ghost closing window hidden on phones.
- Phase 6 (accessibility, performance): **done**. Contrast fixed in both themes (`--accent-text`,
  `--accent-button`, greys in dark windows); focus order and rings verified; reduced motion verified (0 running
  animations, no pin, no Lenis); hero orb loops pause off-screen; viewport-sized blend-mode grain removed;
  fonts self-hosted. There are no raster product images (the product visuals are DOM), so image lazy-loading
  does not apply.
- Phase 7 (review, docs, tests): **done**. Motion spec and design table rewritten; `landing-structure` tests
  guard anchors, sequences and removed effects.

## Final designer review

| Question | Verdict |
| --- | --- |
| Does it look like a template? | Much less: sections have different compositions, one idea each. |
| Anything trying too hard? | Hero code-switch and the pinned showcase are the two showpieces; both explain the product. Everything else is quiet. |
| Too much animation? | 25 coordinated entrances, 2 headline reveals, 1 pinned sequence, counters, marquee; 0 on reduced motion or phones (beyond fades). |
| Too much empty space? | The Agents panel and the capabilities heading/intro gap are airy by choice. |
| Visually repetitive? | Alternating light/dark bands with distinct layouts; the shared eyebrow is the only repeated device. |
| Product believable? | Yes: toolbar, table rows, control bar, realistic type sizes, labelled illustrative. |

Open follow-ups: real adoption numbers and testimonials when they exist; a real product screenshot to
replace the DOM mock once the UI is stable; per-device checks on physical phones.

## Phases

Ordered by impact. Each phase ends with typecheck, tests, and a desktop (1440) + mobile (390) check in both
themes.

### Phase 1 — Tokens (type, space, color)

Files: `app/globals.css`, `app/(marketing)/theme-dark.css`, `app/theme-shared.css`.

- Type scale tokens: `--text-display` (hero), `--text-h2-lg` (closing), `--text-h2` (default), `--text-h2-sm`
  (capabilities, comparison), `--text-lead` 17–18px, `--text-body` 15–16px, `--text-small` 13px,
  `--text-label` 11px mono, with matching line-height and tracking. Body text on the marketing page ≥ 14px,
  labels ≥ 11px. Max measure ~60ch for paragraphs, ~16ch for display headings.
- Spacing tiers: `--section-xl` / `-l` / `-m` / `-s` (e.g. 160 / 128 / 96 / 64 desktop → 96 / 80 / 64 / 48
  mobile). Replace every one-off section padding.
- Color tokens: add `--paper-2`, `--ink-2`, `--muted-2`, `--line-strong`, `--band`, `--band-fg`,
  `--band-muted`; replace hardcoded hexes so `theme-dark.css` only redefines tokens. Fix muted contrast to
  ≥ 4.5:1 for small text.
- Accent meaning, written into the spec: coral = human voice + primary action; lime = live signal only.
  Remove other uses.
- Move fonts to `next/font` (read `node_modules/next/dist/docs/` first) and trim to the weights actually used.

### Phase 2 — Structure and hierarchy

Files: `landing-page.tsx`, `workspace-showcase.tsx`, `globals.css`.

- Remove 02 Process; move its step copy into the showcase tabs' descriptions.
- Fold use-case tags into the closing section as a single line; remove the 08 section.
- Shrink Numbers to a compact band (smaller headline or none; numbers carry it).
- Replace the shared eyebrow/topline pattern with per-section headings sized by the type scale.
- Vary containers: constrained text in capabilities, wide window in showcase, full-bleed gallery, centered
  closing.

### Phase 3 — Motion audit and choreography

Files: `landing-motion.tsx`, `code-switch.tsx`, `ambient-background.tsx`, `motion.css`, `landing-page.tsx`.

- One timeline per section (`data-sequence` on the section; children ordered by role: visual → heading →
  supporting → secondary) replacing per-element `data-reveal`.
- SplitText headline reveal on **two** headings only (signal, closing); others use the section timeline.
- Remove: spotlight edges (`data-spotlight` + CSS + listener), global pointer glow, tag hover lift, gallery
  1.06 magnify (keep a border/opacity change).
- Code-switch: keep (it demonstrates the product), but slow the cycle to ~6 s and pause when the hero is out of
  view.
- Keep: circular theme reveal (user-initiated), pinned showcase, counters, marquee, closing parallax.
- Speeds, documented in the spec: grain static · glow very slow · showcase scrub · content normal.

### Phase 4 — Product UI

Files: `workspace-showcase.tsx`, `voice-preview.tsx`, `screenshot-gallery.tsx`, related CSS.

- Render the window at a realistic scale: text 11–14px, real toolbar hierarchy (title, breadcrumbs, one
  primary action), consistent 4/6/8px internal radii, aligned data rows.
- One layered shadow recipe used only for product windows and floating surfaces; remove others.
- Borders only for structure (sidebar, rows, window edge).
- Mobile: crop (hide sidebar, show content column) instead of shrinking type.

### Phase 5 — Mobile pass (390, 720, 1024)

- Section tiers and type tokens at each breakpoint (not proportional shrink).
- No pin, no SplitText, no marquee on touch: gallery becomes a native scroll-snap strip.
- Check horizontal overflow, tap targets ≥ 44px, menu, hero orb size, header height.

### Phase 6 — Accessibility and performance

- Contrast check both themes; focus order through tabs, comparison rows, gallery controls; reduced-motion run.
- Remove unused listeners/RAF loops from deleted effects; confirm images/heavy panels are lazy; check
  re-renders in the showcase `onUpdate` (only set state when the index changes).

### Phase 7 — Review and docs

- Senior-designer checklist from the brief (template? trying too hard? rhythm? believable product?) against
  screenshots; remove anything that fails.
- Update `docs/landing-motion-spec.md` and the design table in `docs/design-resource-audit.md`.
- Update/adjust tests touched by removed sections (`__tests__/`).

## Decisions needed

Recommended defaults in bold; the plan assumes them unless told otherwise.

1. Merge Process into Showcase — **yes**.
2. Fold Use cases into Closing — **yes**.
3. Remove spotlight edges and pointer glow — **yes**.
4. Keep the code-switch headline — **yes, slowed**.
5. Fonts via `next/font` — **yes**.

## Verification

`npm run typecheck`, `npm test`, `npm run build`; screenshots at 1440 / 1024 / 390 in light, dark and reduced
motion before and after each phase.
