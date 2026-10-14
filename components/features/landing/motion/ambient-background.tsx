/**
 * Fixed, decorative atmosphere behind the whole marketing page. Deliberately sparse: a faint grid and
 * grain for texture and one warm light that drifts very slowly. Nothing else floats.
 * Layers move at different speeds (grain static, glow very slow, grid fixed) so depth is felt, not seen.
 * Loops are CSS; scroll drift is attached by LandingMotion via a data attribute.
 */
export function AmbientBackground() {
  return (
    <div className="ambient-fixed" aria-hidden="true">
      <div className="ambient-grid" />
      <div className="ambient-grain" />
      <div className="ambient-depth" data-ambient-depth="-90"><div className="ambient-glow ambient-glow-coral" /></div>
    </div>
  );
}

/** One quiet light per section. `showcase` also gets a faint perspective floor behind the product. */
export function SectionAmbience({ kind }: Readonly<{ kind: "hero" | "signal" | "showcase" | "stats" | "closing" }>) {
  return (
    <div className={`section-ambience ambience-${kind}`} aria-hidden="true">
      <span className="ambience-glow" />
      {kind === "showcase" ? <span className="ambience-floor" /> : null}
    </div>
  );
}
