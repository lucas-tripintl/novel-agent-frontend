"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRead } from "@/lib/api/auth";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserRead | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (token: string, refreshToken: string, user: UserRead) => void;
  updateToken: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, refreshToken, user) =>
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
        }),

      updateToken: (token, refreshToken) =>
        set({
          token,
          refreshToken,
        }),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "novel-agent-auth",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
