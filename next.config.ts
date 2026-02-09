import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Desabilitar strict mode em produção para evitar double-mounting
  reactStrictMode: process.env.NODE_ENV === 'development',
};

export default nextConfig;
