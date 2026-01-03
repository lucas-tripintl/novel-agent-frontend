"use client";

import { usePolling } from "./use-polling";
import type { ProjectStatus } from "@/types/project";

export interface AnalyzeStatus {
  status: ProjectStatus;
  progress: number;
  currentChapter: number;
  totalChapters: number;
  stats: {
    characters: number;
    worldview: number;
    goldenFingers: number;
    plotlines: number;
  };
  error?: string;
}

interface UseAnalyzeStatusOptions {
  projectId: string;
  enabled?: boolean;
  onComplete?: (data: AnalyzeStatus) => void;
  onError?: (error: Error) => void;
}

export function useAnalyzeStatus({
  projectId,
  enabled = true,
  onComplete,
  onError,
}: UseAnalyzeStatusOptions) {
  return usePolling<AnalyzeStatus>({
    fetcher: async () => {
      const res = await fetch(`/api/projects/${projectId}/analyze/status`);
      if (!res.ok) throw new Error("Failed to fetch analyze status");
      return res.json();
    },
    interval: 2000,
    enabled,
    onSuccess: (data) => {
      if (data.status === "completed") {
        onComplete?.(data);
      }
    },
    onError,
    shouldStop: (data) =>
      data.status === "completed" ||
      data.status === "failed",
  });
}

// 模拟分析状态（用于开发）
export function useMockAnalyzeStatus({
  projectId,
  enabled = true,
  onComplete,
}: UseAnalyzeStatusOptions) {
  return usePolling<AnalyzeStatus>({
    fetcher: async () => {
      // 模拟延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 模拟进度递增
      const stored = sessionStorage.getItem(`analyze-${projectId}`);
      let progress = stored ? parseInt(stored) : 0;
      progress = Math.min(progress + Math.floor(Math.random() * 10) + 5, 100);
      sessionStorage.setItem(`analyze-${projectId}`, String(progress));

      const totalChapters = 100;
      const currentChapter = Math.floor((progress / 100) * totalChapters);

      return {
        status: progress >= 100 ? "completed" : "analyzing",
        progress,
        currentChapter,
        totalChapters,
        stats: {
          characters: Math.floor(currentChapter * 0.5),
          worldview: Math.floor(currentChapter * 0.3),
          goldenFingers: Math.floor(currentChapter * 0.1),
          plotlines: Math.floor(currentChapter * 0.2),
        },
      } as AnalyzeStatus;
    },
    interval: 1000,
    enabled,
    onSuccess: (data) => {
      if (data.status === "completed") {
        onComplete?.(data);
      }
    },
    shouldStop: (data) => data.status === "completed",
  });
}
