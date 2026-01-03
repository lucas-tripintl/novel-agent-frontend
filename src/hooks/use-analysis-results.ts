"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { listEntities, listGoldenFingers, getStyle, getEntity } from "@/lib/api/projects";
import { listEntitiesCrossProject, type CrossProjectEntitiesParams } from "@/lib/api/entities";
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

// ============ 跨项目 API 新版 Hooks ============

/**
 * 跨项目实体查询 - 使用新的 /api/v1/entities 接口
 *
 * 相比 useMultiProjectEntities，只需要一次 API 请求
 */
export function useCrossProjectEntities(
  projectIds: string[],
  options?: {
    entity_type?: EntityType;
    keyword?: string;
    limit?: number;
    skip?: number;
    enabled?: boolean;
  }
) {
  const { entity_type, keyword, limit = 100, skip = 0, enabled = true } = options ?? {};

  return useQuery({
    queryKey: [
      "entities",
      "cross-project",
      projectIds.sort().join(","),
      { entity_type, keyword, limit, skip },
    ],
    queryFn: () =>
      listEntitiesCrossProject({
        project_ids: projectIds,
        entity_type,
        keyword,
        limit,
        skip,
      }),
    enabled: enabled && projectIds.length > 0,
  });
}

/**
 * 跨项目多类型实体查询 - 使用新的 /api/v1/entities 接口
 *
 * 用于世界观等需要多种类型的页面
 */
export function useCrossProjectMultiTypeEntities(
  projectIds: string[],
  entityTypes: EntityType[],
  options?: {
    keyword?: string;
    limit?: number;
    enabled?: boolean;
  }
) {
  const { keyword, limit = 100, enabled = true } = options ?? {};

  // 为每种类型创建一个查询
  const queries = entityTypes.map((entityType) => ({
    queryKey: [
      "entities",
      "cross-project",
      projectIds.sort().join(","),
      { entity_type: entityType, keyword, limit },
    ],
    queryFn: () =>
      listEntitiesCrossProject({
        project_ids: projectIds,
        entity_type: entityType,
        keyword,
        limit,
      }),
    enabled: enabled && projectIds.length > 0,
  }));

  const results = useQueries({ queries });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;

  // 按类型分组
  const entitiesByType: Record<EntityType, EntityRead[]> = {} as Record<EntityType, EntityRead[]>;
  entityTypes.forEach((type, index) => {
    entitiesByType[type] = results[index].data?.items ?? [];
  });

  const totalByType: Record<EntityType, number> = {} as Record<EntityType, number>;
  entityTypes.forEach((type, index) => {
    totalByType[type] = results[index].data?.total ?? 0;
  });

  return { entitiesByType, totalByType, isLoading, error };
}

/**
 * 设定总览统计 - 获取所有类型的实体数量
 *
 * 优化：一次请求获取所有实体，前端按类型分组统计
 * 比之前为每种类型发起单独请求更高效
 */
export function useEntitiesOverview(
  projectIds: string[],
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  const allEntityTypes: EntityType[] = [
    "character",
    "location",
    "worldview",
    "faction",
    "power_system",
    "item",
    "skill",
    "plotline",
    "foreshadowing",
    "golden_finger",
  ];

  // 一次请求获取所有实体（不指定 entity_type）
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "entities",
      "cross-project",
      "overview",
      projectIds.sort().join(","),
    ],
    queryFn: () =>
      listEntitiesCrossProject({
        project_ids: projectIds,
        limit: 1000, // 获取足够多的实体用于统计
      }),
    enabled: enabled && projectIds.length > 0,
  });

  // 前端按类型分组统计
  const stats: Record<EntityType, number> = {} as Record<EntityType, number>;
  allEntityTypes.forEach((type) => {
    stats[type] = 0;
  });

  // 统计每种类型的数量
  if (data?.items) {
    data.items.forEach((entity) => {
      if (stats[entity.entity_type] !== undefined) {
        stats[entity.entity_type]++;
      }
    });
  }

  const total = data?.total ?? 0;

  return { stats, total, isLoading, error, entities: data?.items ?? [] };
}
