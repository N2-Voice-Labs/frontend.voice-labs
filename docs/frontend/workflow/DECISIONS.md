# Product-owner decisions (approval gate after phase 3)

Approved 2026-10-21 by the product owner.

1. **Visual direction:** A+C hybrid "two lanes, one bridge", as recommended in
   `VOICE_LABS_DESIGN_SYSTEM.md`. The seat colours are teal for you, plum for the other person, and lime for the interpreter.
2. **Interpreter setup:** auto-create. Starting a call asks only for two languages. The app creates or reuses an
   interpreter agent behind the scenes (with `engine: "cascaded"` set explicitly, per UX spec §0).
3. **Call ending:** End ends the call for both people, which matches the backend. When the other person drops, show
   "Reconnecting…" and then "Call ended". No separate Leave action in this round.
4. **Scope:** phase 1 of UX spec §10 only. That covers tokens and fonts, the new navigation and landing hero, `/call`,
   the invite flow and `/join`, the call components, and tests. Deferred: the agent test page layout,
   the conversation pages and the latency key fix.

Other open questions in UX spec §11 use the spec's default answers. List those assumptions in the implementation notes.
