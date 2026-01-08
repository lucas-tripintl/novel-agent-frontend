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
 * 使用 labelKey 指向翻译键，在组件中通过 t(option.labelKey) 获取本地化文本
 */
export const PATTERN_TYPE_OPTIONS = [
  { value: "all", labelKey: "types.all" },
  { value: "power_system", labelKey: "types.powerSystem" },
  { value: "plot_pattern", labelKey: "types.plotPattern" },
  { value: "character_archetype", labelKey: "types.characterArchetype" },
  { value: "conflict_pattern", labelKey: "types.conflictPattern" },
  { value: "relationship_dynamic", labelKey: "types.relationshipDynamic" },
  { value: "conflict_escalation", labelKey: "types.conflictEscalation" },
  { value: "cheat_evolution", labelKey: "types.cheatEvolution" },
] as const;

/**
 * 获取模式类型翻译键
 */
export function getPatternTypeKey(type: string): string {
  const typeKeyMap: Record<string, string> = {
    power_system: "types.powerSystem",
    plot_pattern: "types.plotPattern",
    character_archetype: "types.characterArchetype",
    worldview: "types.worldview",
    conflict_pattern: "types.conflictPattern",
    narrative_rhythm: "types.narrativeRhythm",
    chapter_structure: "types.chapterStructure",
    relationship_dynamic: "types.relationshipDynamic",
    conflict_escalation: "types.conflictEscalation",
    cheat_evolution: "types.cheatEvolution",
    cool_point_pattern: "types.coolPointPattern",
    writing_technique: "types.writingTechnique",
    golden_opening_report: "types.goldenOpeningReport",
    character: "types.character",
    location: "types.location",
    faction: "types.faction",
    item: "types.item",
    skill: "types.skill",
    plotline: "types.plotline",
    golden_finger: "types.goldenFinger",
    foreshadowing: "types.foreshadowing",
  };
  return typeKeyMap[type] ?? `types.${type}`;
}
