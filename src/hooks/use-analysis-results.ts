"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { listEntities, listGoldenFingers, getStyle } from "@/lib/api/projects";
import type { EntityType } from "@/types/api";

/**
 * 获取分析结果统计
 */
export function useAnalysisStats(projectId: string | null, enabled = true) {
  const results = useQueries({
    queries: [
      {
        queryKey: ["entities", projectId, "character"],
        queryFn: () => listEntities(projectId!, { entity_type: "character", limit: 1 }),
        enabled: enabled && !!projectId,
      },
      {
        queryKey: ["entities", projectId, "worldview"],
        queryFn: () => listEntities(projectId!, { entity_type: "worldview", limit: 1 }),
        enabled: enabled && !!projectId,
      },
      {
        queryKey: ["entities", projectId, "plotline"],
        queryFn: () => listEntities(projectId!, { entity_type: "plotline", limit: 1 }),
        enabled: enabled && !!projectId,
      },
      {
        queryKey: ["entities", projectId, "foreshadowing"],
        queryFn: () => listEntities(projectId!, { entity_type: "foreshadowing", limit: 1 }),
        enabled: enabled && !!projectId,
      },
      {
        queryKey: ["golden-fingers", projectId],
        queryFn: () => listGoldenFingers(projectId!, { limit: 1 }),
        enabled: enabled && !!projectId,
      },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;

  const stats = {
    characters: results[0].data?.total ?? 0,
    worldview: results[1].data?.total ?? 0,
    plotlines: results[2].data?.total ?? 0,
    foreshadowing: results[3].data?.total ?? 0,
    goldenFingers: results[4].data?.total ?? 0,
  };

  return { stats, isLoading, error };
}

/**
 * 获取风格分析结果
 */
export function useStyleResult(projectId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["style", projectId],
    queryFn: () => getStyle(projectId!),
    enabled: enabled && !!projectId,
    retry: false, // 风格分析可能不存在
  });
}

/**
 * 获取特定类型的实体列表
 */
export function useEntities(
  projectId: string | null,
  entityType: EntityType,
  options?: { limit?: number; enabled?: boolean }
) {
  const { limit = 20, enabled = true } = options ?? {};

  return useQuery({
    queryKey: ["entities", projectId, entityType, { limit }],
    queryFn: () => listEntities(projectId!, { entity_type: entityType, limit }),
    enabled: enabled && !!projectId,
  });
}
