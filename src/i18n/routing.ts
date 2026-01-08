import { defineRouting } from "next-intl/routing";

export const locales = ["zh-CN", "zh-TW", "en", "ja", "ko"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
};

export const localeFlags: Record<Locale, string> = {
  "zh-CN": "🇨🇳",
  "zh-TW": "🇹🇼",
  en: "🇺🇸",
  ja: "🇯🇵",
  ko: "🇰🇷",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "zh-CN",
  localePrefix: "as-needed", // 默认语言不显示前缀
});
