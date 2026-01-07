/**
 * 设定库相关 hooks
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { listEntitiesCrossProject } from "@/lib/api/projects";
import type { EntityType } from "@/types/api";

// Query keys
export const entityLibraryKeys = {
  all: ["entity-library"] as const,
  lists: () => [...entityLibraryKeys.all, "list"] as const,
  list: (params?: InfiniteEntitiesParams) => [...entityLibraryKeys.lists(), params] as const,
};

/** 无限滚动参数 */
export interface InfiniteEntitiesParams {
  /** 项目 ID（可选，不传则返回所有项目） */
  project_id?: string;
  /** 实体类型过滤 */
  entity_type?: EntityType;
  /** 关键字搜索 */
  keyword?: string;
}

/** 每页加载数量 */
const PAGE_SIZE = 20;

/**
 * 无限滚动获取设定列表
 */
export function useInfiniteEntities(params?: InfiniteEntitiesParams) {
  return useInfiniteQuery({
    queryKey: entityLibraryKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      return listEntitiesCrossProject({
        project_ids: params?.project_id ? [params.project_id] : undefined,
        entity_type: params?.entity_type,
        keyword: params?.keyword,
        skip: pageParam,
        limit: PAGE_SIZE,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0,
  });
}

/**
 * 设定库分类配置
 */
export const ENTITY_LIBRARY_TYPE_OPTIONS: { value: EntityType | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "worldview", label: "世界观设定" },
  { value: "character", label: "角色" },
  { value: "plotline", label: "剧情线" },
  { value: "golden_finger", label: "金手指" },
  { value: "foreshadowing", label: "伏笔" },
  { value: "cool_point_pattern", label: "爽点模式" },
  { value: "writing_technique", label: "写作技巧" },
  { value: "golden_opening_report", label: "黄金三章报告" },
];
