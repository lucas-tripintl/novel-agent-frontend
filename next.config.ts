import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const API_URL = process.env.API_URL || "http://192.168.0.77:8000";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // 代理 API 请求，避免 CORS 问题
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
