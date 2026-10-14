# Landing page motion specification

Scope: the public marketing site under `app/(marketing)`. Product/dashboard routes are untouched.

Principle: **a layered motion system, not a collection of animated components.** Server-rendered
sections only carry `data-*` attributes; one client controller (`LandingMotion`) owns smooth scroll,
reveals, parallax, counters and ambient scroll. Only genuinely interactive pieces (showcase tabs,
comparison rows, gallery pause, conversation preview) are client components.

## Stack decisions

| Need | Choice | Why |
| --- | --- | --- |
| Scroll-scrubbed / pinned choreography | GSAP + ScrollTrigger | Anime.js could not express pin + scrub + progress cleanly. |
| Smooth scrolling | Lenis, synced to GSAP's ticker | One RAF loop; ScrollTrigger reads the same scroll position. |
| Infinite/ambient loops, marquee, hover | CSS | No JS cost; trivially paused. |
| Hero orb | Anime.js (unchanged) | Already shipped and scoped; replacing it is out of scope. |
| Styling | Existing plain CSS in `globals.css` | The project has no Tailwind; do not add a second styling system. |

Not added: Tailwind, Framer Motion, Lucide (the site uses text glyphs), WebGL/canvas.

## Layers

1. **Environment** (fixed, `AmbientBackground`): paper base, fine grid, film grain.
2. **Ambient light** (fixed): two radial-gradient glows drifting 30–40 s; no `filter: blur`.
3. **Floating elements** (fixed): 6 thin rings/lines/dots, ≤ 14% opacity, 18–30 s float loops.
4. **Section ambience** (local, CSS): hero glow + rings, showcase glow + perspective floor,
   signal-section glows, stats (near static grain/grid), closing (strongest glow + rotating rings).
5. **Interaction**: one pointer glow (fine pointers only, `quickTo` spring), hover states, tabs.
6. **Content**: reveals, pinned showcase, counters.

Scroll coupling for ambience: fixed layers translate ±40–120 px over the whole document (scrubbed);
content moves 1:1. Opaque sections (dark bands) naturally cover the fixed layers.

## Section specs

| Section | Motion |
| --- | --- |
| Header | Transparent at top → paper + blur + hairline after 16 px scroll (CSS transition 300 ms). Mobile menu: panel + links fade/slide in, `+` rotates to `×`. |
| Hero | Existing staggered CSS entrance (copy 0–290 ms, orb delayed ~250 ms). On scroll: orb drifts down slower than page and fades slightly; scroll cue fades out. |
| 01 Signal | Heading/intro reveal; preview card reveals; tab switch cross-fades the conversation lines (GSAP, 380 ms). |
| 02 Process | Heading reveal; steps stagger 90 ms; step lines draw (scaleX). |
| 03 Capabilities | Rows stagger; row hover shifts arrow and tints background. |
| 04 Showcase (pinned) | Entrance (scrubbed, approach): scale .9→1, y 90→0, rotateX 8°→0, `clip-path` inset → full, opacity. Pin ≈ 2.4 viewport heights; 3 panels (Agents / Playground / Conversations) change by progress; tab indicator slides; progress hairline scrubs; window scale 1→1.03, rotateY 3°→0; glow behind window brightens. Click on a tab scrolls to its segment. **<900 px wide, <640 px tall or reduced motion:** no pin, tabs cross-fade by state. |
| 05 Numbers | Dark band, near-static ambience. Counters count up once when 35% visible; SSR already contains final values. |
| 06 Comparison | Rows stagger in; hover tint; click/Enter expands a row (grid-rows 0fr→1fr, 320 ms). |
| 07 Screens | Heading reveal; single-row marquee of 8 illustrative panels (CSS, 70 s); pauses on hover and via a visible "Pause motion" button; card hover magnifies content (1.06) inside a stable frame. Reduced motion: no marquee, native horizontal scroll. |
| 08 Use cases | Heading reveal; tags stagger. |
| Closing CTA | Faded product window behind headline with parallax (±50 px); strongest ambience; heading reveal. |

## Motion tokens

- Entrance: `opacity 0→1`, `y 24→0`, 0.8 s, `expo.out`; groups stagger 0.09 s.
- Hover: `translateY(-2px)` or `scale(1.02)`; media magnify 1.06.
- Scrub: `scrub: 0.6` on pinned sequences; `scrub: true` on parallax.
- Only `transform`/`opacity`/`clip-path` are animated, except the comparison disclosure
  (`grid-template-rows` on a three-line subtree).

## Accessibility and fallback

- `prefers-reduced-motion`: no Lenis, no GSAP reveals/scrub/pin/counters (final values shown), no
  ambient loops or pointer glow, marquee becomes a scrollable strip, tabs switch without movement.
- Content is fully visible without JS (reveal start states are applied by JS only).
- Decorative layers: `aria-hidden`, `pointer-events: none`.
- Tabs follow the WAI-ARIA tabs pattern (roving tabindex, arrow keys).

## Honesty rules (carried over from the existing page)

- Every product visual is labelled illustrative; no real-looking screenshots of unbuilt features.
- Numbers are product facts taken from the page copy (3 provider layers, 2 languages in one
  conversation, 1 workspace), not usage metrics. Replace with real adoption data when it exists.
- No testimonials: there are no real quotes to show, and invented ones would be fabricated.
- The comparison names a category ("scripted voice menus"), not specific competitors.

## Theming (light / dark)

- Scope: only `.marketing-root[data-theme]`; the product routes keep their light theme.
- Default follows `prefers-color-scheme`; the header switch (`role="switch"`) stores the choice in
  `localStorage` (`vl-theme`). An inline script in the layout sets the theme before first paint, and
  `ThemeToggle` re-applies it on mount (client-side navigation does not re-run inline scripts).
- `app/(marketing)/theme-dark.css` overrides the shared tokens (`--ink`, `--paper`, `--line`, ...) and the
  hardcoded light values per section. Ambience is retuned for dark: light grid lines, screen-blended grain,
  quieter glows so the page does not turn milky.
- Switching fades colours for 450 ms (class `theme-transition`, removed afterwards so it never competes
  with GSAP transforms).
