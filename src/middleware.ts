import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // 匹配所有路径，排除以下：
  // - api 路由
  // - Next.js 内部路由 (_next)
  // - 静态文件 (favicon, images 等)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
