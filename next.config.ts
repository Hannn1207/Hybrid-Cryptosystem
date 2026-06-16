import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-forge"],
  turbopack: {},
};

export default nextConfig;
