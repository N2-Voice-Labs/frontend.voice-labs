import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  turbopack: { root: process.cwd() },
  // Testing through one HTTPS origin: PLATFORM_PROXY_TARGET=http://127.0.0.1:8000 serves the Platform at
  // /_platform/* on this site (set NEXT_PUBLIC_PLATFORM_URL to <this origin>/_platform). Off unless set.
  async rewrites() {
    const target = process.env.PLATFORM_PROXY_TARGET;
    return target ? [{ source: "/_platform/:path*", destination: `${target.replace(/\/$/, "")}/:path*` }] : [];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
