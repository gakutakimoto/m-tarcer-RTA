import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // ⚠️ 警告は表示されますが、ビルドは停止しなくなります
    ignoreBuildErrors: true,
  }
};

export default nextConfig;