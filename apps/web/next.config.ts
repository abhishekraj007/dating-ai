import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cheery-akita-850.convex.site",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.convex.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.filestackcontent.com",
      },
      {
        protocol: "https",
        hostname: "**.feelai.chat",
      },
      {
        protocol: "https",
        hostname: "**.realaichat.com",
      },
    ],
  },
};

export default nextConfig;
