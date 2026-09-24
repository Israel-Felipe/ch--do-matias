import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloud Agent / local preview to load HMR and client bundles.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
