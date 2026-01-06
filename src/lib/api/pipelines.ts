/**
 * 写作流水线 API - 大纲生成、章节写作等异步任务
 */

import { apiClient } from "./client";
import type {
  PipelineTaskResponse,
  GenerateNovelOutlineParams,
  GenerateVolumeOutlineParams,
  GenerateChapterOutlineParams,
  WriteChapterParams,
} from "@/types/api";

// ============ 大纲生成 ============

/**
 * 生成总纲（全书框架）
 * POST /api/v1/projects/{project_id}/pipelines/generate-novel-outline
 */
export function generateNovelOutline(
  projectId: string,
  params: GenerateNovelOutlineParams
): Promise<PipelineTaskResponse> {
  return apiClient.post<PipelineTaskResponse>(
    `/projects/${projectId}/pipelines/generate-novel-outline`,
    params
  );
}

/**
 * 生成卷纲（分卷大纲）
 * POST /api/v1/projects/{project_id}/pipelines/generate-volume-outline
 */
export function generateVolumeOutline(
  projectId: string,
  params: GenerateVolumeOutlineParams
): Promise<PipelineTaskResponse> {
  return apiClient.post<PipelineTaskResponse>(
    `/projects/${projectId}/pipelines/generate-volume-outline`,
    params
  );
}

/**
 * 生成章节细纲
 * POST /api/v1/projects/{project_id}/pipelines/generate-outline
 */
export function generateChapterOutline(
  projectId: string,
  params: GenerateChapterOutlineParams
): Promise<PipelineTaskResponse> {
  return apiClient.post<PipelineTaskResponse>(
    `/projects/${projectId}/pipelines/generate-outline`,
    params
  );
}

// ============ 章节写作 ============

/**
 * 触发章节写作任务
 * 执行完整流程：细纲生成 → 上下文筛选 → 写作 → 审核 → 改写 → 设定更新
 * POST /api/v1/projects/{project_id}/pipelines/write-chapter
 */
export function writeChapter(
  projectId: string,
  params: WriteChapterParams
): Promise<PipelineTaskResponse> {
  return apiClient.post<PipelineTaskResponse>(
    `/projects/${projectId}/pipelines/write-chapter`,
    params
  );
}
