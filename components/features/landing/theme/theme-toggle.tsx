"use client";

import { useEffect, useState } from "react";
import { applyTheme, readStoredTheme, storeTheme, systemTheme, type Theme } from "./theme";

/**
 * Header switch. The icon is chosen by CSS from the wrapper's data-theme, so it never flickers;
 * state here only drives aria-checked. Follows the system until the visitor picks a theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Also covers client-side navigation, where the inline init script does not run again.
    const stored = readStoredTheme();
    const initial = stored ?? systemTheme();
    applyTheme(initial);
    setTheme(initial);
    if (stored || typeof window.matchMedia !== "function") return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme()) return;
      const next: Theme = event.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.querySelector(".marketing-root");
    root?.classList.add("theme-transition");
    applyTheme(next);
    storeTheme(next);
    setTheme(next);
    window.setTimeout(() => root?.classList.remove("theme-transition"), 500);
  }

  return (
    <button className="theme-toggle" data-bare type="button" role="switch" aria-checked={theme === "dark"} aria-label="Dark theme" onClick={toggle}>
      <svg className="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      <svg className="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" /></svg>
    </button>
  );
}
