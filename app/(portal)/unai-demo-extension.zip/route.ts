import { extensionFiles, portalFor, zip } from "@/lib/demo-extension";

/** The widget-preview Chrome extension, with this portal's address filled in (see lib/demo-extension.ts). */
export function GET(request: Request) {
  const body = zip(extensionFiles(portalFor(request)), "unai-widget-preview/");
  return new Response(body as unknown as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": 'attachment; filename="unai-widget-preview.zip"',
      "cache-control": "no-store",
    },
  });
}
