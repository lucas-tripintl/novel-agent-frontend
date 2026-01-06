/**
 * 大纲查询 API
 */

import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/api";
import type {
  OutlinesSummary,
  NovelOutline,
  VolumeOutline,
  VolumeOutlineSummary,
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
