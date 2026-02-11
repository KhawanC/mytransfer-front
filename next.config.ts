import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: process.env.NODE_ENV === 'development',
};

export default nextConfig;
