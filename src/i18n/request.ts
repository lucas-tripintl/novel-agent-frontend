import { getRequestConfig } from "next-intl/server";
import { routing, type Locale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // 从请求中获取语言
  let locale = await requestLocale;

  // 验证语言有效性，无效则使用默认语言
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
