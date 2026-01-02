import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeType = "cyberpunk" | "ink" | "bamboo";

export interface ThemeInfo {
  id: ThemeType;
  name: string;
  description: string;
  icon: string;
  preview: {
    bg: string;
    primary: string;
    accent: string;
  };
}

export const themes: ThemeInfo[] = [
  {
    id: "cyberpunk",
    name: "科技黑",
    description: "深色科技风，荧光绿 + 电光紫",
    icon: "🌙",
    preview: {
      bg: "#000000",
      primary: "#22c55e",
      accent: "#a855f7",
    },
  },
  {
    id: "ink",
    name: "墨韵白",
    description: "宣纸质感，水墨灰 + 朱砂红",
    icon: "📜",
    preview: {
      bg: "#faf8f5",
      primary: "#292524",
      accent: "#dc2626",
    },
  },
  {
    id: "bamboo",
    name: "竹青绿",
    description: "护眼舒适，竹青绿 + 金秋橙",
    icon: "🌿",
    preview: {
      bg: "#f6faf6",
      primary: "#16a34a",
      accent: "#ea580c",
    },
  },
];

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "cyberpunk",
      setTheme: (theme) => {
        set({ theme });
        // 更新 DOM
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
          // Cyberpunk 主题需要 dark class
          if (theme === "cyberpunk") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
    }),
    {
      name: "novel-agent-theme",
      onRehydrateStorage: () => (state) => {
        // 页面加载时恢复主题
        if (state && typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", state.theme);
          if (state.theme === "cyberpunk") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
    }
  )
);

