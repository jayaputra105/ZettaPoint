import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.BASE_PATH?.replace(/\/$/, "") || "",
  transpilePackages: ["framer-motion"],
};

export default nextConfig;
