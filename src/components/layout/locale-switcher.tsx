"use client";

import { useCallback } from "react";
import { Globe, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routing, localeNames, localeFlags, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// 辅助函数：设置 cookie（在组件外部定义，避免 React Compiler 警告）
function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}`;
}

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("locale");

  const handleLocaleChange = useCallback((newLocale: Locale) => {
    if (newLocale !== locale) {
      // 保存用户偏好到 Cookie
      setLocaleCookie(newLocale);
      // 导航到同一路径但不同语言
      router.replace(pathname, { locale: newLocale });
    }
  }, [locale, pathname, router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 gap-1.5 rounded-full transition-colors"
          title={t("switch")}
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="text-sm hidden sm:inline-block">
            {localeNames[locale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit min-w-36">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              loc === locale && "bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </span>
            {loc === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
