/**
 * 跨项目查询设定 Hook
 * 用于在技能生成对话框中选择设定作为参考
 */

import { useQuery } from "@tanstack/react-query";
import { listProjects, listEntitiesCrossProject } from "@/lib/api/projects";
import type { EntityType, EntityRead } from "@/types/api";

export interface EntitiesGlobalParams {
  entityType?: EntityType;
  keyword?: string;
  limit?: number;
  /** 是否启用查询，默认 true */
  enabled?: boolean;
}

// Query keys
export const entitiesGlobalKeys = {
  all: ["entities-global"] as const,
  list: (params?: EntitiesGlobalParams) => [...entitiesGlobalKeys.all, params] as const,
};

/**
 * 扩展的 EntityRead，包含来源项目名称
 */
export interface EntityReadWithProject extends EntityRead {
  project_name?: string;
}

/**
 * 跨项目查询设定
 * 不传 project_ids，后端返回用户所有项目的设定
 */
export function useEntitiesGlobal(params?: EntitiesGlobalParams) {
  const { enabled = true, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: entitiesGlobalKeys.list(queryParams),
    enabled,
    queryFn: async () => {
      // 并行请求：设定列表 + 项目列表（用于映射名称）
      const [entitiesResult, projectsResult] = await Promise.all([
        listEntitiesCrossProject({
          entity_type: queryParams?.entityType,
          keyword: queryParams?.keyword,
          limit: queryParams?.limit ?? 50,
        }),
        listProjects({ limit: 100 }),
      ]);

      // 创建项目 ID 到名称的映射
      const projectNameMap = new Map(
        projectsResult.items.map((p) => [p.id, p.name])
      );

      // 给每个设定添加项目名称
      const itemsWithProject: EntityReadWithProject[] = entitiesResult.items.map(
        (entity) => ({
          ...entity,
          project_name: projectNameMap.get(entity.project_id) ?? undefined,
        })
      );

      return {
        items: itemsWithProject,
        total: entitiesResult.total,
      };
    },
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  });
}
