/**
 * 技能相关的 React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  generateSkill,
  listProjectSkills,
  enableProjectSkill,
  disableProjectSkill,
  reorderProjectSkills,
} from "@/lib/api/skills";
import type {
  SkillListParams,
  SkillCreate,
  SkillUpdate,
  SkillGenerateRequest,
  ProjectSkillListParams,
  EnableSkillRequest,
  ReorderSkillsRequest,
} from "@/types/skills";

// Query keys
export const skillKeys = {
  all: ["skills"] as const,
  lists: () => [...skillKeys.all, "list"] as const,
  list: (params?: SkillListParams) => [...skillKeys.lists(), params] as const,
  details: () => [...skillKeys.all, "detail"] as const,
  detail: (id: string) => [...skillKeys.details(), id] as const,
  projectSkills: (projectId: string) =>
    [...skillKeys.all, "project", projectId] as const,
  projectSkillsWithParams: (
    projectId: string,
    params?: ProjectSkillListParams
  ) => [...skillKeys.projectSkills(projectId), params] as const,
};

// ============ 技能库 Hooks ============

/**
 * 获取技能列表
 */
export function useSkills(params?: SkillListParams) {
  return useQuery({
    queryKey: skillKeys.list(params),
    queryFn: () => listSkills(params),
  });
}

/**
 * 获取技能详情
 */
export function useSkill(skillId: string, enabled = true) {
  return useQuery({
    queryKey: skillKeys.detail(skillId),
    queryFn: () => getSkill(skillId),
    enabled: enabled && !!skillId,
  });
}

/**
 * 创建技能
 */
export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SkillCreate) => createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
    },
  });
}

/**
 * 更新技能
 */
export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ skillId, data }: { skillId: string; data: SkillUpdate }) =>
      updateSkill(skillId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: skillKeys.detail(variables.skillId),
      });
    },
  });
}

/**
 * 删除技能
 */
export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skillId: string) => deleteSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
    },
  });
}

/**
 * AI 生成技能
 */
export function useGenerateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SkillGenerateRequest) => generateSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
    },
  });
}

// ============ 项目技能 Hooks ============

/**
 * 获取项目已启用的技能
 */
export function useProjectSkills(
  projectId: string,
  params?: ProjectSkillListParams,
  enabled = true
) {
  return useQuery({
    queryKey: skillKeys.projectSkillsWithParams(projectId, params),
    queryFn: () => listProjectSkills(projectId, params),
    enabled: enabled && !!projectId,
  });
}

/**
 * 为项目启用技能
 */
export function useEnableProjectSkill(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EnableSkillRequest) =>
      enableProjectSkill(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skillKeys.projectSkills(projectId),
      });
    },
  });
}

/**
 * 禁用项目技能
 */
export function useDisableProjectSkill(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      skillId,
      stage,
    }: {
      skillId: string;
      stage?: string | null;
    }) => disableProjectSkill(projectId, skillId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skillKeys.projectSkills(projectId),
      });
    },
  });
}

/**
 * 调整项目技能顺序
 */
export function useReorderProjectSkills(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderSkillsRequest) =>
      reorderProjectSkills(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skillKeys.projectSkills(projectId),
      });
    },
  });
}

// ============ 辅助常量 ============

/** 技能分类选项 - value 和对应的翻译键 */
export const SKILL_CATEGORY_OPTIONS = [
  { value: "all", labelKey: "categories.all" },
  { value: "platform_style", labelKey: "categories.platformStyle" },
  { value: "rhythm", labelKey: "categories.rhythm" },
  { value: "technique", labelKey: "categories.technique" },
  { value: "anti_ai", labelKey: "categories.antiAi" },
  { value: "other", labelKey: "categories.other" },
] as const;

/** 适用阶段选项 - value 和对应的翻译键 */
export const SKILL_STAGE_OPTIONS = [
  { value: "all", labelKey: "stages.all" },
  { value: "outline", labelKey: "stages.outline" },
  { value: "chapter_outline", labelKey: "stages.chapterOutline" },
  { value: "writing", labelKey: "stages.writing" },
  { value: "rewriting", labelKey: "stages.rewriting" },
  { value: "review", labelKey: "stages.review" },
] as const;

/** 技能来源选项 - value 和对应的翻译键 */
export const SKILL_VISIBILITY_OPTIONS = [
  { value: "all", labelKey: "visibility.all" },
  { value: "system", labelKey: "visibility.system" },
  { value: "team", labelKey: "visibility.team" },
] as const;

/** 技能排序选项 - value 和对应的翻译键 */
export const SKILL_SORT_OPTIONS = [
  { value: "updated_at", labelKey: "sort.updatedAt" },
  { value: "created_at", labelKey: "sort.createdAt" },
  { value: "downloads", labelKey: "sort.downloads" },
  { value: "rating", labelKey: "sort.rating" },
  { value: "name", labelKey: "sort.name" },
] as const;

/** 排序方向选项 - value 和对应的翻译键 */
export const SORT_ORDER_OPTIONS = [
  { value: "desc", labelKey: "sortOrder.desc" },
  { value: "asc", labelKey: "sortOrder.asc" },
] as const;

/** 获取分类翻译键 */
export function getSkillCategoryKey(category: string): string {
  const option = SKILL_CATEGORY_OPTIONS.find((o) => o.value === category);
  return option?.labelKey ?? `categories.${category}`;
}

/** 获取阶段翻译键 */
export function getSkillStageKey(stage: string): string {
  const option = SKILL_STAGE_OPTIONS.find((o) => o.value === stage);
  return option?.labelKey ?? `stages.${stage}`;
}

/** 获取来源翻译键 */
export function getSkillVisibilityKey(visibility: string): string {
  const option = SKILL_VISIBILITY_OPTIONS.find((o) => o.value === visibility);
  return option?.labelKey ?? `visibility.${visibility}`;
}

/** 获取排序字段翻译键 */
export function getSkillSortKey(sortBy: string): string {
  const option = SKILL_SORT_OPTIONS.find((o) => o.value === sortBy);
  return option?.labelKey ?? `sort.${sortBy}`;
}
