/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScriptのビルドエラーを無視
    ignoreBuildErrors: true,
  },
  // ESLintのエラーも無視（念のため）
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;