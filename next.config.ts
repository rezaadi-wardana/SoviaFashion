import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
    //   Baris di bawah ini adalah KUNCI SOLUSI
  allowedDevOrigins: ['localhost', '*.ngrok-free.dev'],

};

export default nextConfig;