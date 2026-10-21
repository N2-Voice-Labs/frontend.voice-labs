// Screenshot helper for the redesign before/after record. Not part of the app or the test suites.
// Usage: node docs/frontend/screenshots/capture.mjs <before|after> [baseUrl]
// Set CHROME_BIN to use an already-installed Chromium build.
// Needs a running dev server (npm run dev). The Platform may be down; whatever renders is captured.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const set = process.argv[2] ?? "before";
const base = process.argv[3] ?? "http://localhost:3000";
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, set);
await mkdir(out, { recursive: true });

const pages = [
  { name: "landing", path: "/" },
  { name: "agents", path: "/agents" },
  { name: "agent-test", path: "/agents/00000000-0000-0000-0000-000000000001/test" },
  { name: "conversation", path: "/conversations/00000000-0000-0000-0000-000000000001" },
];
if (set === "after") {
  pages.push(
    { name: "call-setup", path: "/call" },
    { name: "call-live-fixture", path: "/call/fixture?state=live" },
    { name: "call-waiting-fixture", path: "/call/fixture?state=waiting" },
    { name: "call-translating-fixture", path: "/call/fixture?state=translating" },
    { name: "call-reconnecting-fixture", path: "/call/fixture?state=reconnecting" },
    { name: "call-ended-fixture", path: "/call/fixture?state=ended" },
    { name: "join", path: "/join#v=1&s=00000000-0000-0000-0000-00000000000a&c=00000000-0000-0000-0000-00000000000b&u=ws%3A%2F%2Flocalhost%3A7880&t=demo&k=demo&me=en&them=ko&from=Ji-woo&name=Sam&exp=" + (Math.floor(Date.now() / 1000) + 540) },
    { name: "join-invalid", path: "/join" },
  );
}
const widths = [1440, 390];
const themes = set === "after" ? ["light", "dark"] : ["light"];

const browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
for (const theme of themes) {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 }, colorScheme: theme, permissions: ["microphone"] });
    await context.addInitScript((value) => { try { localStorage.setItem("vl-theme", value); } catch {} }, theme);
    const page = await context.newPage();
    for (const item of pages) {
      try {
        await page.goto(base + item.path, { waitUntil: "networkidle", timeout: 30_000 });
      } catch {
        // Polling pages never go idle; settle for load.
        await page.goto(base + item.path, { waitUntil: "load", timeout: 30_000 }).catch(() => undefined);
      }
      // Hide the Next.js dev indicator so it doesn't cover the End button (review minor 13).
      await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }" }).catch(() => undefined);
      await page.waitForTimeout(1500);
      const file = path.join(out, `${item.name}-${width}${themes.length > 1 ? `-${theme}` : ""}.png`);
      await page.screenshot({ path: file, fullPage: item.name === "landing" ? false : true });
      console.log("saved", path.relative(process.cwd(), file));
    }
    await context.close();
  }
}
await browser.close();
