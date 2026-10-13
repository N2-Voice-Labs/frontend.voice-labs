import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  turbopack: { root: process.cwd() },
};

export default nextConfig;

initOpenNextCloudflareForDev();
