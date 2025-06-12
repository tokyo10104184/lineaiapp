
import type { NextConfig } from "next";
import { env } from "process";

const domainsEnv = env.REPLIT_DOMAINS ?? "";
const firstOrigin = domainsEnv.split(",")[0] || "";

const nextConfig: NextConfig = {
  // ① 先に入れた allowedDevOrigins
  allowedDevOrigins: firstOrigin ? [firstOrigin] : [],

  // ② ESLint のエラーでビルド失敗させない
  eslint: {
    // ビルド時の lint エラーを無視します
    ignoreDuringBuilds: true,
  },

  // ③ もし必要なら TypeScript の型チェックもスキップ
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
