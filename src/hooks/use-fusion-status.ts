"use client";

import { usePolling } from "./use-polling";
import type { FusionStatus, FusionExtracted } from "@/types/fusion";

export interface FusionStatusResponse {
  status: FusionStatus;
  progress: number;
  stage: "extracting" | "fusing";
  currentProject?: string;
  extracted?: FusionExtracted;
  error?: string;
}

interface UseFusionStatusOptions {
  taskId: string;
  enabled?: boolean;
  onComplete?: (data: FusionStatusResponse) => void;
  onError?: (error: Error) => void;
}

export function useFusionStatus({
  taskId,
  enabled = true,
  onComplete,
  onError,
}: UseFusionStatusOptions) {
  return usePolling<FusionStatusResponse>({
    fetcher: async () => {
      const res = await fetch(`/api/fusion/${taskId}/status`);
      if (!res.ok) throw new Error("Failed to fetch fusion status");
      return res.json();
    },
    interval: 3000,
    enabled,
    onSuccess: (data) => {
      if (data.status === "completed") {
        onComplete?.(data);
      }
    },
    onError,
    shouldStop: (data) =>
      data.status === "completed" ||
      data.status === "failed" ||
      data.status === "done",
  });
}

// 模拟融合状态（用于开发）
export function useMockFusionStatus({
  taskId,
  enabled = true,
  onComplete,
}: UseFusionStatusOptions) {
  return usePolling<FusionStatusResponse>({
    fetcher: async () => {
      // 模拟延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 模拟进度递增
      const stored = sessionStorage.getItem(`fusion-${taskId}`);
      let progress = stored ? parseInt(stored) : 0;
      progress = Math.min(progress + Math.floor(Math.random() * 15) + 5, 100);
      sessionStorage.setItem(`fusion-${taskId}`, String(progress));

      const stage: "extracting" | "fusing" =
        progress < 50 ? "extracting" : "fusing";

      return {
        status: progress >= 100 ? "completed" : stage === "extracting" ? "extracting" : "fusing",
        progress,
        stage,
        extracted: {
          powerSystems: Math.floor(progress * 0.1),
          plotPatterns: Math.floor(progress * 0.15),
          archetypes: Math.floor(progress * 0.08),
          worldview: Math.floor(progress * 0.12),
        },
      } as FusionStatusResponse;
    },
    interval: 1500,
    enabled,
    onSuccess: (data) => {
      if (data.status === "completed") {
        onComplete?.(data);
      }
    },
    shouldStop: (data) => data.status === "completed",
  });
}
