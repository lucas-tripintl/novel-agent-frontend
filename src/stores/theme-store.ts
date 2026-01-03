import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeType = "cyberpunk" | "ink";

export interface ThemeInfo {
  id: ThemeType;
  name: string;
  description: string;
  preview: {
    bg: string;
    primary: string;
    accent: string;
  };
}

export const themes: ThemeInfo[] = [
  {
    id: "ink",
    name: "墨韵白",
    description: "宣纸质感，水墨灰调",
    preview: {
      bg: "#faf8f5",
      primary: "#292524",
      accent: "#787774",
    },
  },
  {
    id: "cyberpunk",
    name: "科技黑",
    description: "深色科技风，荧光绿 + 电光紫",
    preview: {
      bg: "#0c0c14",
      primary: "#3dd68c",
      accent: "#b47aff",
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
      theme: "ink",
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

