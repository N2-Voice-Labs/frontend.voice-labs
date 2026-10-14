export type Theme = "light" | "dark";

export const THEME_KEY = "vl-theme";
const ROOT = ".marketing-root";

export function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
}

export function systemTheme(): Theme {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.querySelector(ROOT)?.setAttribute("data-theme", theme);
}

/** Runs before first paint so the page never flashes the wrong theme. Mirrors the helpers above. */
export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var t=s==="dark"||s==="light"?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var r=document.querySelector("${ROOT}");if(r)r.setAttribute("data-theme",t)}catch(e){}})();`;
