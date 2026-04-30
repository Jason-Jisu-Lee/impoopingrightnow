import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const workspaceRoot = path.resolve(process.cwd(), "../..");

if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  transpilePackages: ["@impoopingrightnow/shared"],
  outputFileTracingRoot: workspaceRoot,
  devIndicators: false,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
