"use client";

import { useState } from "react";

const rows = [
  {
    topic: "Language",
    menu: "Pick a language up front",
    labs: "Follows the conversation when it changes",
    detail: "A caller can start in Russian, finish in English, and mix both in one sentence. The agent keeps up instead of asking again.",
  },
  {
    topic: "Interruptions",
    menu: "Plays the whole prompt first",
    labs: "Lets people speak over the agent",
    detail: "Real-time speech means people can finish a thought, change direction, or cut in without waiting for a menu to end.",
  },
  {
    topic: "Setup",
    menu: "Decision trees and scripts",
    labs: "Purpose, instructions, languages, voice",
    detail: "Describe what the agent is for and how it should sound in one workspace, rather than drawing every branch by hand.",
  },
  {
    topic: "Providers",
    menu: "One fixed stack",
    labs: "Speech, language, and voice per agent",
    detail: "Choose providers for each layer per agent, or start from runtime defaults when you want a simpler path.",
  },
  {
    topic: "Learning",
    menu: "Call logs, if any",
    labs: "Transcripts and runtime events",
    detail: "Review saved conversations and what the runtime heard, then adjust the agent before the next call.",
  },
] as const;

/** A short, honest category comparison. Rows expand on click or Enter. */
export function Comparison() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="compare" data-reveal-group>
      <div className="compare-head" aria-hidden="true">
        <span />
        <span>Scripted voice menus</span>
        <span className="is-labs">Voice Labs</span>
        <span />
      </div>
      <ul className="compare-list">
        {rows.map((row, index) => {
          const expanded = open === index;
          return (
            <li className={expanded ? "compare-row is-open" : "compare-row"} key={row.topic} data-reveal-item>
              <h3>
                <button
                  className="compare-button"
                  data-bare
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`compare-detail-${index}`}
                  onClick={() => setOpen(expanded ? null : index)}
                >
                  <span className="compare-topic">{row.topic}</span>
                  <span className="compare-cell"><small>Scripted voice menus</small>{row.menu}</span>
                  <span className="compare-cell is-labs"><small>Voice Labs</small>{row.labs}</span>
                  <span className="compare-toggle" aria-hidden="true">+</span>
                </button>
              </h3>
              <div className="compare-detail" id={`compare-detail-${index}`} role="region" aria-label={`${row.topic} detail`} inert={!expanded}>
                <div><p>{row.detail}</p></div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
