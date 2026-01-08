/**
 * API 请求国际化工具
 *
 * 获取当前 locale 用于 Accept-Language 请求头
 */

import { locales, type Locale } from "@/i18n/routing";

const DEFAULT_LOCALE: Locale = "zh-CN";

/**
 * 获取当前 API 请求使用的 locale
 *
 * 客户端：从 URL path 或 cookie 获取
 * 服务端：从 cookie 获取或使用默认值
 */
export function getApiLocale(): string {
  if (typeof window === "undefined") {
    // 服务端 - 使用默认值（实际的 SSR 请求应该通过其他方式传递 locale）
    return DEFAULT_LOCALE;
  }

  // 客户端 - 从 URL path 获取
  // 由于使用 localePrefix: "as-needed"，默认语言不在 URL 中
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];

  // 检查第一个路径段是否是有效的 locale
  if (firstSegment && (locales as readonly string[]).includes(firstSegment)) {
    return firstSegment;
  }

  // 尝试从 cookie 获取（next-intl 可能存储在 NEXT_LOCALE cookie）
  const cookieLocale = getCookie("NEXT_LOCALE");
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  // 默认返回中文
  return DEFAULT_LOCALE;
}

/**
 * 简单的 cookie 读取工具
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}
