"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { listEntities, listGoldenFingers, getStyle, getEntity } from "@/lib/api/projects";
import type { EntityType, EntityRead } from "@/types/api";

// Query keys
export const entityKeys = {
  all: ["entities"] as const,
  lists: () => [...entityKeys.all, "list"] as const,
  list: (projectId: string, params?: { entity_type?: EntityType; limit?: number; skip?: number; keyword?: string }) =>
    [...entityKeys.lists(), projectId, params] as const,
  details: () => [...entityKeys.all, "detail"] as const,
  detail: (projectId: string, entityId: string) => [...entityKeys.details(), projectId, entityId] as const,
  byProject: (projectId: string) => [...entityKeys.all, "project", projectId] as const,
};

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
  options?: {
    limit?: number;
    skip?: number;
    keyword?: string;
    enabled?: boolean;
  }
) {
  const { limit = 100, skip = 0, keyword, enabled = true } = options ?? {};

  return useQuery({
    queryKey: entityKeys.list(projectId!, { entity_type: entityType, limit, skip, keyword }),
    queryFn: () => listEntities(projectId!, { entity_type: entityType, limit, skip, keyword }),
    enabled: enabled && !!projectId,
  });
}

/**
 * 获取多个项目的实体列表（用于跨项目查看）
 */
export function useMultiProjectEntities(
  projectIds: string[],
  entityType: EntityType,
  options?: {
    limit?: number;
    keyword?: string;
    enabled?: boolean;
  }
) {
  const { limit = 100, keyword, enabled = true } = options ?? {};

  const results = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: entityKeys.list(projectId, { entity_type: entityType, limit, keyword }),
      queryFn: () => listEntities(projectId, { entity_type: entityType, limit, keyword }),
      enabled: enabled && !!projectId,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;

  // 合并所有项目的实体，添加 project_id 标识
  const entities: EntityRead[] = results
    .flatMap((r) => r.data?.items ?? []);

  const total = results.reduce((acc, r) => acc + (r.data?.total ?? 0), 0);

  return { entities, total, isLoading, error };
}

/**
 * 获取单个实体详情
 */
export function useEntity(
  projectId: string | null,
  entityId: string | null,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: entityKeys.detail(projectId!, entityId!),
    queryFn: () => getEntity(projectId!, entityId!),
    enabled: enabled && !!projectId && !!entityId,
  });
}

/**
 * 获取多种类型的实体（用于世界观页面）
 */
export function useMultiTypeEntities(
  projectIds: string[],
  entityTypes: EntityType[],
  options?: {
    limit?: number;
    keyword?: string;
    enabled?: boolean;
  }
) {
  const { limit = 100, keyword, enabled = true } = options ?? {};

  const queries = projectIds.flatMap((projectId) =>
    entityTypes.map((entityType) => ({
      queryKey: entityKeys.list(projectId, { entity_type: entityType, limit, keyword }),
      queryFn: () => listEntities(projectId, { entity_type: entityType, limit, keyword }),
      enabled: enabled && !!projectId,
    }))
  );

  const results = useQueries({ queries });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;

  // 按类型分组
  const entitiesByType: Record<EntityType, EntityRead[]> = {} as Record<EntityType, EntityRead[]>;
  entityTypes.forEach((type) => {
    entitiesByType[type] = [];
  });

  results.forEach((r) => {
    if (r.data?.items) {
      r.data.items.forEach((entity) => {
        if (entitiesByType[entity.entity_type]) {
          entitiesByType[entity.entity_type].push(entity);
        }
      });
    }
  });

  return { entitiesByType, isLoading, error };
}
