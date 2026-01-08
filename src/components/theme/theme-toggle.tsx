"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();
    const t = useTranslations("theme");

    const toggleTheme = () => {
        setTheme(theme === "cyberpunk" ? "ink" : "cyberpunk");
    };

    const nextTheme = theme === "cyberpunk" ? t("ink") : t("cyberpunk");

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 transition-colors"
            title={t("switchTo", { theme: nextTheme })}
        >
            {theme === "cyberpunk" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
            )}
            <span className="sr-only">{t("switch")}</span>
        </Button>
    );
}
