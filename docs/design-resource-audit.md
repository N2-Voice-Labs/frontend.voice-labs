# Voice Labs design resource audit

Reviewed 13 October 2026. The seven repositories below are the entries shown in [Bekbolot's design list](https://github.com/stars/abdibekbolot/lists/design). Repository metadata and README documentation were checked before choosing dependencies.

## Curated repositories

| Repository | Category and useful patterns | Compatibility | License considerations | Recommendation |
| --- | --- | --- | --- | --- |
| [google-labs-code/design.md](https://github.com/google-labs-code/design.md) | Design-system specification and TypeScript tooling for documenting visual identity for coding agents. Useful for keeping tokens and component intent explicit. | The format and CLI are framework-independent; its implementation is TypeScript. It is not a UI kit. | Apache-2.0. Preserve its license and notices if code is ever reused. | **Adapt** the explicit design-spec approach; no package needed for this milestone. |
| [penpot/penpot](https://github.com/penpot/penpot) | Open design platform with reusable components, variants, and design tokens. Useful as a design-system reference and for future designer handoff. | Penpot itself is a Clojure application, not a React component dependency. Exported assets/styles can be used in web projects. | MPL-2.0. Review file-level copyleft obligations before redistributing modified Penpot code. | **Reference** its token and component concepts; do not add Penpot to the frontend runtime. |
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | Curated collection of published `DESIGN.md` files. Useful for comparing how teams document typography, color, spacing, and interaction rules. | Markdown reference material; no React or Next.js runtime dependency. | MIT for the collection. Individual brand specifications and assets can carry separate rights; do not reproduce them. | **Reference** the documentation format, not the listed brands' designs. |
| [srizzon/git-city](https://github.com/srizzon/git-city) | Interactive 3D pixel-art GitHub profile example. Useful as an experiment in spatial interaction, but it does not solve a Voice Labs product need. | TypeScript web project, but its 3D experience is not a reusable accessible React UI component. | AGPL-3.0. Incorporating or modifying code in a distributed service has source-sharing obligations; no code is reused. | **Skip** for this product. |
| [Ileriayo/markdown-badges](https://github.com/Ileriayo/markdown-badges) | Markdown badge collection for developer profiles and project READMEs. No production interface components. | Not a React/Next.js UI library. | MIT for the repository; individual third-party logos and trademarks remain subject to their terms. | **Skip** for the frontend. |
| [juliangarnier/anime](https://github.com/juliangarnier/anime) | Anime.js animation engine. v4 provides scoped animations, timelines, stagger, SVG helpers, and scroll-observer utilities. | Framework-independent JavaScript with an official React integration using `useEffect`, `createScope`, and `revert`; compatible with this React/Next.js app. | MIT. Keep the license notice with redistributed copies. | **Use.** Added Anime.js v4 for the scoped, reduced-motion-aware hero voice visualization. |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | TypeScript framework for authoring HTML scenes and rendering video, aimed at agent-generated video workflows. | Not a browser UI component kit or a fit for app motion; introduces a separate rendering workflow. | Apache-2.0. Preserve notices if reused; no code is reused. | **Skip** for the application UI. |

## Skills reviewed

- [Taste Skill](https://github.com/Leonxlnx/taste-skill) is MIT-licensed and was installed locally into `.agents/skills/`. The `redesign-existing-projects` audit-first guidance and `gpt-taste` visual hierarchy guidance were reviewed. Requested skills installed successfully; no skill code is shipped to users. The latter recommends GSAP. It was originally skipped in favour of Anime.js; as of 14 October 2026 GSAP + ScrollTrigger is used for the marketing page's scroll-scrubbed and pinned choreography (see `docs/landing-motion-spec.md`), because Anime.js could not express pin + scrub + progress cleanly. Its imposed layout, randomization, and decoration rules were still not followed where they conflicted with the existing app or product requirements.
- Anime.js v4 [React integration](https://animejs.com/documentation/getting-started/using-with-react) documents `createScope({ root })`, effect setup, and `scope.revert()` cleanup. Its [animation](https://animejs.com/documentation/animation/), [timeline](https://animejs.com/documentation/timeline/), [SVG helpers](https://animejs.com/documentation/svg/), and [`onScroll` / ScrollObserver](https://animejs.com/documentation/events/onscroll/scrollobserver-properties) references were reviewed. Animation APIs were applied to the hero orb only; timeline, SVG, and scroll helpers are not needed in this milestone.

## Voice Labs design specification

The direction is an **editorial signal studio**: warm paper and ink create a calm, legible workspace; coral marks the human voice and key actions; signal-lime is reserved for the waveform and selected emphasis. A restrained orbital voice mark adds technical character without implying audio is connected. The result should feel like a voice product rather than a generic AI dashboard.

| System area | Current foundation |
| --- | --- |
| Color | Paper `#f6f5ef`, surface `#fffefa`, ink `#1d2022`, muted `#747675`, line `#dfdfd8`, voice coral `#e54b38` / `#ff624c`, signal lime `#d9f455`, visible focus `#283ee8`. |
| Typography | Manrope for display, DM Sans for product copy, DM Mono for compact utility labels, and a system editorial serif for occasional contrast. Use balanced wraps for display text and readable measure for body copy. |
| Layout | Responsive max-width 1320px marketing container; asymmetric copy/art hero; 4px base spacing unit with larger section rhythm; product pages retain their existing separate shell. |
| Surfaces | Warm, low-contrast paper layers; fine neutral borders; small control radii (3px) and slightly softer preview surfaces (5px); use shadows only to establish depth. |
| Interaction | Visible 3px focus outline, clear hover/pressed CTA states, real route/anchor destinations, native disclosure menu on mobile. |
| Motion | CSS for entrances, hover and ambient loops; Anime.js v4 for the hero orb; GSAP + ScrollTrigger + Lenis for reveals, the pinned workspace showcase, parallax and counters (marketing page only). Pinning is desktop-only and follows scroll one-to-one; `prefers-reduced-motion` disables Lenis, scrubbing, loops and the pointer light. Full spec: `docs/landing-motion-spec.md`. |
| Responsive | Existing 1050px, 720px, and 390px breakpoints; mobile uses a native disclosure menu and stacked hero rather than a compressed desktop split. |

## Reference use

[KumushAI](https://kumush.ai/) was reviewed for concise product storytelling, a clear primary action, conversational examples, and a visible path from configuration to operation. Voice Labs keeps its own copy, warm editorial palette, orbital voice visualization, section composition, and illustrative conversation content. No KumushAI branding or assets are used.
