/**
 * Fixed, decorative atmosphere behind the whole marketing page. Markup only: loops are CSS,
 * scroll drift and the pointer light are attached by LandingMotion through data attributes.
 * Wrapper elements (data-ambient-depth) receive GSAP transforms; inner elements own CSS loops.
 */
export function AmbientBackground() {
  return (
    <div className="ambient-fixed" aria-hidden="true">
      <div className="ambient-grid" />
      <div className="ambient-grain" />
      <div className="ambient-depth" data-ambient-depth="-110"><div className="ambient-glow ambient-glow-coral" /></div>
      <div className="ambient-depth" data-ambient-depth="70"><div className="ambient-glow ambient-glow-signal" /></div>
      <div className="ambient-depth" data-ambient-depth="-45">
        <span className="float-shape float-ring float-ring-a" />
        <span className="float-shape float-ring float-ring-b" />
        <span className="float-shape float-dot float-dot-a" />
        <span className="float-shape float-dot float-dot-b" />
        <span className="float-shape float-line float-line-a" />
        <span className="float-shape float-line float-line-b" />
      </div>
      <div className="pointer-glow" />
    </div>
  );
}

/** Section-level atmosphere. `kind` selects the CSS recipe; the section decides where it sits. */
export function SectionAmbience({ kind }: Readonly<{ kind: "hero" | "signal" | "showcase" | "stats" | "closing" }>) {
  return (
    <div className={`section-ambience ambience-${kind}`} aria-hidden="true">
      <span className="ambience-glow" />
      {kind === "hero" || kind === "closing" ? <><span className="ambience-ring ambience-ring-a" /><span className="ambience-ring ambience-ring-b" /></> : null}
      {kind === "signal" ? <span className="ambience-glow ambience-glow-second" /> : null}
      {kind === "showcase" ? <span className="ambience-floor" /> : null}
    </div>
  );
}
