import path from "node:path";
import type { NextConfig } from "next";

const workspaceRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@impoopingrightnow/shared"],
  outputFileTracingRoot: workspaceRoot,
  devIndicators: false,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
