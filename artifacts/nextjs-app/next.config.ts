import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.BASE_PATH?.replace(/\/$/, "") || "",
  transpilePackages: ["framer-motion"],
  // Tambahin ini biar /ads.txt selalu diarahkan ke public
  async rewrites() {
    return [
      {
        source: "/ads.txt",
        destination: "/ads.txt",
        basePath: false, // Ini kuncinya, biar gak kena basePath
      },
    ];
  },
};

export default nextConfig;