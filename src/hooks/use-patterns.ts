/**
 * 抽象模式相关 hooks
 */

import { useQuery } from "@tanstack/react-query";
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
 * 模式类型筛选选项
 */
export const PATTERN_TYPE_OPTIONS: { value: EntityType | "all"; label: string }[] = [
  { value: "all", label: "全部类型" },
  { value: "power_system", label: "力量体系" },
  { value: "plot_pattern", label: "剧情模式" },
  { value: "character_archetype", label: "角色原型" },
  { value: "worldview", label: "世界观模式" },
  { value: "conflict_pattern", label: "冲突模式" },
  { value: "narrative_rhythm", label: "叙事节奏" },
  { value: "cool_point_pattern", label: "爽点模式" },
  { value: "writing_technique", label: "写作技巧" },
];
