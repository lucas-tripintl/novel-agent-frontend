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
  listProjectSkills,
  enableProjectSkill,
  disableProjectSkill,
  reorderProjectSkills,
} from "@/lib/api/skills";
import type {
  SkillListParams,
  SkillCreate,
  SkillUpdate,
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
    mutationFn: (skillId: string) => disableProjectSkill(projectId, skillId),
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

/** 技能分类选项 */
export const SKILL_CATEGORY_OPTIONS = [
  { value: "all", label: "全部分类" },
  { value: "platform_style", label: "平台风格" },
  { value: "rhythm", label: "节奏控制" },
  { value: "technique", label: "写作技巧" },
  { value: "anti_ai", label: "去AI味" },
  { value: "other", label: "其他" },
] as const;

/** 适用阶段选项 */
export const SKILL_STAGE_OPTIONS = [
  { value: "all", label: "全部阶段" },
  { value: "outline", label: "大纲规划" },
  { value: "chapter_outline", label: "章节细纲" },
  { value: "writing", label: "首次写作" },
  { value: "rewriting", label: "改写润色" },
  { value: "review", label: "一致性审核" },
] as const;

/** 技能来源选项 */
export const SKILL_VISIBILITY_OPTIONS = [
  { value: "all", label: "全部来源" },
  { value: "system", label: "系统预置" },
  { value: "team", label: "用户自建" },
] as const;

/** 技能排序选项 */
export const SKILL_SORT_OPTIONS = [
  { value: "updated_at", label: "更新时间" },
  { value: "created_at", label: "创建时间" },
  { value: "downloads", label: "下载量" },
  { value: "rating", label: "评分" },
  { value: "name", label: "名称" },
] as const;

/** 排序方向选项 */
export const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "降序" },
  { value: "asc", label: "升序" },
] as const;

/** 获取分类标签 */
export function getSkillCategoryLabel(category: string): string {
  const option = SKILL_CATEGORY_OPTIONS.find((o) => o.value === category);
  return option?.label ?? category;
}

/** 获取阶段标签 */
export function getSkillStageLabel(stage: string): string {
  const option = SKILL_STAGE_OPTIONS.find((o) => o.value === stage);
  return option?.label ?? stage;
}

/** 获取来源标签 */
export function getSkillVisibilityLabel(visibility: string): string {
  if (visibility === "system") return "系统";
  if (visibility === "team") return "自建";
  return visibility;
}

/** 获取排序字段标签 */
export function getSkillSortLabel(sortBy: string): string {
  const option = SKILL_SORT_OPTIONS.find((o) => o.value === sortBy);
  return option?.label ?? sortBy;
}
