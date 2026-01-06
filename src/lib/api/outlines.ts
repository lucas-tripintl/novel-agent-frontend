/**
 * 大纲 API - 查询、编辑、删除
 */

import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  OutlinesSummary,
  NovelOutline,
  NovelOutlineUpdateParams,
  VolumeOutline,
  VolumeOutlineSummary,
  VolumeOutlineUpdateParams,
  ProjectTasksSummary,
} from "@/types/outline";

// ============ 大纲查询 ============

/**
 * 获取大纲状态汇总
 * GET /api/v1/projects/{project_id}/outlines
 */
export async function getOutlinesSummary(
  projectId: string
): Promise<OutlinesSummary> {
  return apiClient.get<OutlinesSummary>(`/projects/${projectId}/outlines`);
}

/**
 * 获取总纲
 * GET /api/v1/projects/{project_id}/outlines/novel
 */
export async function getNovelOutline(
  projectId: string
): Promise<NovelOutline> {
  return apiClient.get<NovelOutline>(`/projects/${projectId}/outlines/novel`);
}

/**
 * 获取卷纲列表
 * GET /api/v1/projects/{project_id}/outlines/volumes
 */
export async function listVolumeOutlines(
  projectId: string,
  params?: { skip?: number; limit?: number }
): Promise<PaginatedResponse<VolumeOutlineSummary>> {
  return apiClient.get<PaginatedResponse<VolumeOutlineSummary>>(
    `/projects/${projectId}/outlines/volumes`,
    {
      params: params as Record<string, string | number | boolean | undefined>,
    }
  );
}

/**
 * 获取指定卷纲
 * GET /api/v1/projects/{project_id}/outlines/volumes/{volume_number}
 */
export async function getVolumeOutline(
  projectId: string,
  volumeNumber: number
): Promise<VolumeOutline> {
  return apiClient.get<VolumeOutline>(
    `/projects/${projectId}/outlines/volumes/${volumeNumber}`
  );
}

/**
 * 根据章节号获取当前卷纲
 * GET /api/v1/projects/{project_id}/outlines/volumes/current?chapter_number=X
 */
export async function getCurrentVolumeOutline(
  projectId: string,
  chapterNumber: number
): Promise<VolumeOutline> {
  return apiClient.get<VolumeOutline>(
    `/projects/${projectId}/outlines/volumes/current`,
    { params: { chapter_number: chapterNumber } }
  );
}

// ============ 项目任务接口 ============

/**
 * 获取项目任务汇总
 * GET /api/v1/projects/{project_id}/tasks
 */
export async function getProjectTasksSummary(
  projectId: string,
  params?: { job_type?: string; recent_limit?: number }
): Promise<ProjectTasksSummary> {
  return apiClient.get<ProjectTasksSummary>(`/projects/${projectId}/tasks`, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * 获取项目进行中的任务
 * GET /api/v1/projects/{project_id}/tasks/active
 */
export async function getProjectActiveTasks(
  projectId: string,
  params?: { job_types?: string[] }
): Promise<import("@/types/api").TaskRead[]> {
  // 将 job_types 数组转换为多个查询参数
  const searchParams = new URLSearchParams();
  if (params?.job_types) {
    params.job_types.forEach((type) => searchParams.append("job_types", type));
  }
  const queryString = searchParams.toString();
  const url = `/projects/${projectId}/tasks/active${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<import("@/types/api").TaskRead[]>(url);
}

// ============ 大纲编辑 ============

/**
 * 更新总纲
 * PUT /api/v1/projects/{project_id}/outlines/novel
 */
export async function updateNovelOutline(
  projectId: string,
  data: NovelOutlineUpdateParams
): Promise<NovelOutline> {
  return apiClient.put<NovelOutline>(
    `/projects/${projectId}/outlines/novel`,
    data
  );
}

/**
 * 更新卷纲
 * PUT /api/v1/projects/{project_id}/outlines/volumes/{volume_number}
 */
export async function updateVolumeOutline(
  projectId: string,
  volumeNumber: number,
  data: VolumeOutlineUpdateParams
): Promise<VolumeOutline> {
  return apiClient.put<VolumeOutline>(
    `/projects/${projectId}/outlines/volumes/${volumeNumber}`,
    data
  );
}

// ============ 大纲删除 ============

/**
 * 删除总纲
 * DELETE /api/v1/projects/{project_id}/outlines/novel
 */
export async function deleteNovelOutline(
  projectId: string
): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(
    `/projects/${projectId}/outlines/novel`
  );
}

/**
 * 删除卷纲
 * DELETE /api/v1/projects/{project_id}/outlines/volumes/{volume_number}
 */
export async function deleteVolumeOutline(
  projectId: string,
  volumeNumber: number
): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(
    `/projects/${projectId}/outlines/volumes/${volumeNumber}`
  );
}
