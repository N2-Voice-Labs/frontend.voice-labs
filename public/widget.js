/*
 * UNAI assistant widget: one line on any website adds the admissions assistant (voice, chat, officer hand-off).
 *
 *   <script src="https://<this portal>/widget.js" async></script>
 *
 * Options (attributes on the script tag):
 *   data-label="Ask Admissions"   launcher text
 *   data-position="right|left"    corner (default right)
 *   data-open="true"              open the panel immediately
 *
 * The assistant itself runs in an iframe served from this portal (/embed), so the host page's CSS and
 * scripts cannot affect it and it reaches the Platform exactly like the portal does. The launcher lives in a
 * shadow root for the same reason. Loading the script a second time toggles the panel (used by the bookmarklet).
 * Whether the panel is open is remembered for the tab (sessionStorage), so it comes back open after a refresh or
 * a click to another page; the assistant keeps its chat for the tab too. A call in progress ends with the page.
 */
(function () {
  "use strict";
  if (window.UNAIWidget) {
    window.UNAIWidget.toggle();
    return;
  }

  var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var base = new URL(script && script.src ? script.src : location.href, location.href);
  var origin = base.origin;
  var data = (script && script.dataset) || {};
  var label = data.label || "Ask Admissions";
  var side = data.position === "left" ? "left" : "right";
  var OPEN_KEY = "unai-widget-open";

  var host = document.createElement("div");
  host.setAttribute("data-unai-widget", "");
  host.style.cssText = "all: initial; position: fixed; z-index: 2147483000; bottom: 0; " + side + ": 0;";
  var root = host.attachShadow({ mode: "open" });

  root.innerHTML =
    "<style>" +
    ":host { all: initial; }" +
    "[hidden] { display: none !important; }" +
    ".launch { position: fixed; " + side + ": max(20px, env(safe-area-inset-" + side + ", 0px)); bottom: max(20px, env(safe-area-inset-bottom, 0px));" +
    "  display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 20px 0 16px; border: 0; border-radius: 999px;" +
    "  background: #17396b; color: #fff; font: 600 15px/1 -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;" +
    "  box-shadow: 0 10px 30px rgba(15, 35, 70, .28), 0 2px 6px rgba(15, 35, 70, .2); cursor: pointer; }" +
    ".launch:hover { background: #0f2a52; }" +
    ".launch:focus-visible { outline: 3px solid #8fb3ec; outline-offset: 3px; }" +
    ".dot { width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.14); display: grid; place-items: center; }" +
    ".panel { position: fixed; " + side + ": max(20px, env(safe-area-inset-" + side + ", 0px)); bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 64px);" +
    "  width: 400px; max-width: calc(100vw - 40px); height: min(680px, calc(100vh - 120px)); border-radius: 18px; overflow: hidden;" +
    "  background: #fff; box-shadow: 0 24px 60px rgba(15, 35, 70, .3), 0 4px 12px rgba(15, 35, 70, .15); }" +
    ".panel iframe { width: 100%; height: 100%; border: 0; display: block; }" +
    "@media (max-width: 520px) {" +
    "  .panel { inset: 0; width: auto; max-width: none; height: auto; border-radius: 0; }" +
    "  :host([data-open]) .launch { display: none; }" +
    "}" +
    "@media (prefers-reduced-motion: no-preference) { .panel { animation: rise .18s ease-out; } }" +
    "@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }" +
    "</style>" +
    '<div class="panel" role="dialog" aria-label="' + escapeAttr(label) + '" hidden></div>' +
    '<button class="launch" type="button" aria-expanded="false">' +
    '<span class="dot" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span>' +
    "<span>" + escapeHtml(label) + "</span></button>";

  var panel = root.querySelector(".panel");
  var launch = root.querySelector(".launch");
  var frame = null;

  function open() {
    if (!frame) {
      // Created on first open, so pages that never use the assistant don't load it.
      frame = document.createElement("iframe");
      frame.title = label;
      frame.src = origin + "/embed";
      frame.setAttribute("allow", "microphone; autoplay; clipboard-write");
      panel.appendChild(frame);
    }
    panel.hidden = false;
    remember(true);
    host.setAttribute("data-open", "");
    launch.setAttribute("aria-expanded", "true");
    frame.focus();
  }

  function close() {
    // Only hides it: a call in progress keeps running and is there again on reopen.
    panel.hidden = true;
    remember(false);
    host.removeAttribute("data-open");
    launch.setAttribute("aria-expanded", "false");
    launch.focus();
  }

  function toggle() {
    if (panel.hidden) open();
    else close();
  }

  launch.addEventListener("click", toggle);
  window.addEventListener("message", function (event) {
    if (event.origin === origin && event.data && event.data.type === "unai:close") close();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) close();
  });

  (document.body || document.documentElement).appendChild(host);
  window.UNAIWidget = { open: open, close: close, toggle: toggle };
  // Reopen after a refresh or a click to another page of the same site (this tab only).
  if (data.open === "true" || recall()) open();

  function remember(isOpen) {
    try {
      if (isOpen) sessionStorage.setItem(OPEN_KEY, "1");
      else sessionStorage.removeItem(OPEN_KEY);
    } catch (e) { /* storage blocked: the widget just starts closed */ }
  }
  function recall() {
    try { return sessionStorage.getItem(OPEN_KEY) === "1"; } catch (e) { return false; }
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeAttr(text) {
    return escapeHtml(text);
  }
})();
