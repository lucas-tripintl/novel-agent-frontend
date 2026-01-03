"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();

    const toggleTheme = () => {
        setTheme(theme === "cyberpunk" ? "ink" : "cyberpunk");
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 transition-colors"
            title={theme === "cyberpunk" ? "切换到亮色模式" : "切换到暗色模式"}
        >
            {theme === "cyberpunk" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
            )}
            <span className="sr-only">切换主题</span>
        </Button>
    );
}
