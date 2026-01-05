/**
 * 技能相关 API
 */

import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  SkillBrief,
  SkillRead,
  SkillCreate,
  SkillUpdate,
  SkillListParams,
  ProjectSkillRead,
  ProjectSkillListParams,
  EnableSkillRequest,
  ReorderSkillsRequest,
} from "@/types/skills";

// ============ 技能库管理 ============

/**
 * 列出可用技能
 * 返回系统预置 + 用户自建的技能列表
 */
export async function listSkills(params?: SkillListParams) {
  return apiClient.get<PaginatedResponse<SkillBrief>>("/skills", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * 获取技能详情
 */
export async function getSkill(skillId: string) {
  return apiClient.get<SkillRead>(`/skills/${skillId}`);
}

/**
 * 创建自定义技能
 */
export async function createSkill(data: SkillCreate) {
  return apiClient.post<SkillRead>("/skills", data);
}

/**
 * 更新技能
 * 仅团队技能可修改，系统技能返回 403
 */
export async function updateSkill(skillId: string, data: SkillUpdate) {
  return apiClient.patch<SkillRead>(`/skills/${skillId}`, data);
}

/**
 * 删除技能
 * 仅团队技能可删除，系统技能返回 403
 */
export async function deleteSkill(skillId: string) {
  return apiClient.delete(`/skills/${skillId}`);
}

// ============ 项目技能配置 ============

/**
 * 列出项目已启用的技能
 */
export async function listProjectSkills(
  projectId: string,
  params?: ProjectSkillListParams
) {
  return apiClient.get<ProjectSkillRead[]>(`/skills/projects/${projectId}`, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * 为项目启用技能
 * 限制: 每个项目最多启用 5 个技能
 */
export async function enableProjectSkill(
  projectId: string,
  data: EnableSkillRequest
) {
  return apiClient.post<ProjectSkillRead>(`/skills/projects/${projectId}`, data);
}

/**
 * 禁用项目技能
 */
export async function disableProjectSkill(projectId: string, skillId: string) {
  return apiClient.delete(`/skills/projects/${projectId}/${skillId}`);
}

/**
 * 调整项目技能顺序
 */
export async function reorderProjectSkills(
  projectId: string,
  data: ReorderSkillsRequest
) {
  return apiClient.patch(`/skills/projects/${projectId}/order`, data);
}
