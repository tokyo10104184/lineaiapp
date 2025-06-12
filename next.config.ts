import type { NextConfig } from "next";
import { env } from "process";

const domainsEnv = env.REPLIT_DOMAINS ?? "";      // 未設定なら空文字列
const firstOrigin = domainsEnv.split(",")[0] || "";  // 空配列時は空文字

const nextConfig: NextConfig = {
  allowedDevOrigins: firstOrigin ? [firstOrigin] : [],
};

export default nextConfig;
