"use client";

import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useThemeStore, themes, type ThemeType } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  // 初始化时应用主题
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "cyberpunk") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const currentTheme = themes.find((t) => t.id === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">{currentTheme?.icon} {currentTheme?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          选择主题
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-start gap-3 p-3 cursor-pointer",
              theme === t.id && "bg-accent"
            )}
          >
            {/* 主题预览色块 */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg"
              style={{ backgroundColor: t.preview.bg }}
            >
              {t.icon}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.name}</span>
                {theme === t.id && (
                  <span className="text-xs text-primary">✓ 当前</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              {/* 颜色预览 */}
              <div className="flex gap-1.5 pt-1">
                <div
                  className="h-3 w-3 rounded-full border"
                  style={{ backgroundColor: t.preview.bg }}
                  title="背景色"
                />
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: t.preview.primary }}
                  title="主色"
                />
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: t.preview.accent }}
                  title="强调色"
                />
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 紧凑版切换器（用于侧边栏底部）
export function ThemeSwitcherCompact() {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    const themeOrder: ThemeType[] = ["cyberpunk", "ink", "bamboo"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const currentTheme = themes.find((t) => t.id === theme);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
    >
      <div className="flex items-center gap-2">
        <span>{currentTheme?.icon}</span>
        <span>{currentTheme?.name}</span>
      </div>
    </Button>
  );
}

