import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Playwright webServer to access Next dev resources via 127.0.0.1
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
