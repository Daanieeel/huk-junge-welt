import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "static.c.huk24.de" },
      { hostname: "upload.wikimedia.org" },
      { hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
