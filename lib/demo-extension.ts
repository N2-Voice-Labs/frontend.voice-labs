/**
 * The "UNAI widget preview" Chrome extension, served as a zip from /unai-demo-extension.zip.
 *
 * A bookmarklet's widget is gone after a refresh or a click to another page; this extension adds the widget
 * (public/widget.js from this portal) to every page load on the sites in its list, so a demo on a university's
 * live website keeps working while you browse it. It only changes pages in the browser where it's installed.
 * Install: chrome://extensions → Developer mode → Load unpacked → the unzipped folder.
 */

export const DEFAULT_SITES = ["apply.inha.ac.kr", "admission.inha.ac.kr"];

export function extensionFiles(portal: string): Record<string, string> {
  const defaults = JSON.stringify({ portal, sites: DEFAULT_SITES });
  return {
    "manifest.json": JSON.stringify(
      {
        manifest_version: 3,
        name: "UNAI widget preview",
        version: "1.0.0",
        description: "Shows the UNAI assistant widget on the websites you list, on every page, for demos.",
        permissions: ["storage"],
        // Two parts: Chrome blocks remote scripts added from an extension's own (isolated) world, so page.js runs in
        // the page's world and loads widget.js when content.js (which can read the settings) asks it to.
        content_scripts: [
          { matches: ["https://*/*", "http://*/*"], js: ["page.js"], run_at: "document_start", world: "MAIN" },
          { matches: ["https://*/*", "http://*/*"], js: ["content.js"], run_at: "document_idle" },
        ],
        action: { default_title: "UNAI widget preview", default_popup: "popup.html" },
      },
      null,
      2,
    ),
    "content.js": `// Adds the UNAI widget to every page load on the listed sites (top window only).
const DEFAULTS = ${defaults};
chrome.storage.sync.get(DEFAULTS, ({ portal, sites, enabled }) => {
  if (enabled === false || window.top !== window || !portal) return;
  const host = location.hostname;
  if (!sites.some((s) => host === s || host.endsWith("." + s))) return;
  document.dispatchEvent(new CustomEvent("unai-widget-load", { detail: portal.replace(/\\/+$/, "") + "/widget.js" }));
});
`,
    "page.js": `// Runs in the page's own world, where the page's rules (not the extension's) decide what may load.
document.addEventListener("unai-widget-load", (event) => {
  if (typeof event.detail !== "string" || !/^https?:\\/\\//.test(event.detail)) return;
  if (document.querySelector("[data-unai-widget], script[data-unai-extension]")) return;
  const script = document.createElement("script");
  script.src = event.detail;
  script.async = true;
  script.dataset.unaiExtension = "";
  (document.body || document.documentElement).appendChild(script);
});
`,
    "popup.html": `<!doctype html>
<html><head><meta charset="utf-8"><title>UNAI widget preview</title>
<style>
body { width: 320px; margin: 0; padding: 16px; font: 13px/1.45 system-ui, sans-serif; color: #15181d; }
h1 { font-size: 15px; margin: 0 0 4px; } p { margin: 0 0 12px; color: #5a6472; }
label { display: block; font-weight: 600; margin: 10px 0 4px; }
input, textarea { width: 100%; box-sizing: border-box; font: 12px ui-monospace, monospace; padding: 6px 8px; border: 1px solid #c9d0d8; border-radius: 6px; }
textarea { height: 70px; resize: vertical; }
.row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.row label { margin: 0; font-weight: 500; }
button { margin-top: 14px; width: 100%; padding: 8px; border: 0; border-radius: 6px; background: #17396b; color: #fff; font-weight: 600; cursor: pointer; }
#status { margin-top: 8px; color: #2f7a4a; min-height: 1em; }
</style></head>
<body>
<h1>UNAI widget preview</h1>
<p>Shows the assistant on every page of these sites, in this browser only.</p>
<div class="row"><input id="enabled" type="checkbox" style="width:auto"><label for="enabled">On</label></div>
<label for="portal">Portal address</label>
<input id="portal" type="url" placeholder="https://…">
<label for="sites">Sites (one per line)</label>
<textarea id="sites"></textarea>
<button id="save" type="button">Save</button>
<div id="status" role="status"></div>
<script src="popup.js"></script>
</body></html>
`,
    "popup.js": `const DEFAULTS = ${defaults};
const $ = (id) => document.getElementById(id);
chrome.storage.sync.get({ ...DEFAULTS, enabled: true }, (s) => {
  $("portal").value = s.portal;
  $("sites").value = s.sites.join("\\n");
  $("enabled").checked = s.enabled !== false;
});
$("save").addEventListener("click", () => {
  const sites = $("sites").value.split(/\\s+/).map((x) => x.trim().replace(/^https?:\\/\\//, "").replace(/\\/.*$/, "")).filter(Boolean);
  chrome.storage.sync.set({ portal: $("portal").value.trim(), sites, enabled: $("enabled").checked }, () => {
    $("status").textContent = "Saved. Reload the page to apply.";
  });
});
`,
  };
}

// ---- Minimal zip writer (stored, no compression): enough for a handful of small text files. ----

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(files: Record<string, string>, folder = ""): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = enc.encode(folder + name);
    const data = enc.encode(text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, nameBytes.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const centralSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of all) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** The portal address to bake in: an explicit ?portal= (sent by the install page), else the request's own. */
export function portalFor(request: Request): string {
  const url = new URL(request.url);
  const asked = url.searchParams.get("portal");
  if (asked && /^https?:\/\/[^/\s]+$/.test(asked.replace(/\/+$/, ""))) return asked.replace(/\/+$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
