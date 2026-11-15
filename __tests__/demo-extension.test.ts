import { expect, test } from "vitest";
import { crc32, extensionFiles, portalFor, zip } from "@/lib/demo-extension";

test("crc32 matches the standard check value", () => {
  expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
});

test("the zip is a valid archive holding the extension files under one folder", () => {
  const files = extensionFiles("https://portal.example");
  const bytes = zip(files, "unai-widget-preview/");
  const view = new DataView(bytes.buffer);
  expect(view.getUint32(0, true)).toBe(0x04034b50); // local file header
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50); // end of central directory
  expect(view.getUint16(end + 10, true)).toBe(Object.keys(files).length);
  const text = new TextDecoder().decode(bytes);
  expect(text).toContain("unai-widget-preview/manifest.json");
  expect(JSON.parse(files["manifest.json"]).manifest_version).toBe(3);
  expect(files["content.js"]).toContain('"portal":"https://portal.example"');
  expect(files["content.js"]).toContain("apply.inha.ac.kr");
});

test("the baked-in portal address comes from ?portal=, else the forwarded host; junk is ignored", () => {
  expect(portalFor(new Request("http://127.0.0.1:3000/x.zip?portal=https%3A%2F%2Fdemo.example%2F"))).toBe("https://demo.example");
  const viaProxy = new Request("http://127.0.0.1:3000/x.zip?portal=javascript:alert(1)", { headers: { "x-forwarded-host": "abc.trycloudflare.com", "x-forwarded-proto": "https" } });
  expect(portalFor(viaProxy)).toBe("https://abc.trycloudflare.com");
});
