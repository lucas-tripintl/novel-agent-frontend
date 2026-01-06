/**
 * 抽象模式相关 hooks
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { listPatterns, getPattern, type PatternsParams } from "@/lib/api/patterns";
import type { EntityType } from "@/types/api";

// Query keys
export const patternKeys = {
  all: ["patterns"] as const,
  lists: () => [...patternKeys.all, "list"] as const,
  list: (params?: PatternsParams) => [...patternKeys.lists(), params] as const,
  details: () => [...patternKeys.all, "detail"] as const,
  detail: (id: string) => [...patternKeys.details(), id] as const,
};

/**
 * 获取抽象模式列表
 */
export function usePatterns(params?: PatternsParams) {
  return useQuery({
    queryKey: patternKeys.list(params),
    queryFn: () => listPatterns(params),
  });
}

/** 无限滚动参数（不含分页参数） */
export type InfinitePatternsParams = Omit<PatternsParams, "skip" | "limit">;

/** 每页加载数量 */
const PAGE_SIZE = 20;

/**
 * 无限滚动获取抽象模式列表
 */
export function useInfinitePatterns(params?: InfinitePatternsParams) {
  return useInfiniteQuery({
    queryKey: [...patternKeys.lists(), "infinite", params] as const,
    queryFn: async ({ pageParam = 0 }) => {
      return listPatterns({
        ...params,
        skip: pageParam,
        limit: PAGE_SIZE,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.items.length, 0);
      // 如果已加载数量小于总数，返回下一页的 skip 值
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0,
  });
}

/**
 * 获取单个抽象模式详情
 */
export function usePattern(patternId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: patternKeys.detail(patternId),
    queryFn: () => getPattern(patternId),
    enabled: enabled && !!patternId,
  });
}

/**
 * 模式类型筛选选项（仅保留 7 种核心 PATTERN 类型）
 */
export const PATTERN_TYPE_OPTIONS: { value: EntityType | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "power_system", label: "力量体系" },
  { value: "plot_pattern", label: "剧情模式" },
  { value: "character_archetype", label: "角色原型" },
  { value: "conflict_pattern", label: "冲突模式" },
  { value: "relationship_dynamic", label: "关系动态" },
  { value: "conflict_escalation", label: "冲突升级" },
  { value: "cheat_evolution", label: "金手指演化" },
];
