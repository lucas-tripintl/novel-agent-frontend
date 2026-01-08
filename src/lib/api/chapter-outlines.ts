/**
 * 章节细纲 API
 *
 * 章节细纲独立于章节存储，支持：
 * - AI 自动生成细纲
 * - 人工编辑调整
 * - 独立于章节管理（可先生成细纲再写作）
 */

import { apiClient } from "./client";
import type {
  ChapterOutlineRead,
  ChapterOutlineCreate,
  GenerateChapterOutlineParams,
  GenerateChapterOutlineResponse,
} from "@/types/chapter-outline";

/**
 * 获取章节细纲列表
 */
export async function getChapterOutlines(
  projectId: string,
  params?: {
    chapter_start?: number;
    chapter_end?: number;
  }
) {
  return apiClient.get<ChapterOutlineRead[]>(
    `/projects/${projectId}/chapters/outlines`,
    { params }
  );
}

/**
 * 获取单个章节细纲
 */
export async function getChapterOutline(
  projectId: string,
  chapterNumber: number
) {
  return apiClient.get<ChapterOutlineRead>(
    `/projects/${projectId}/chapters/${chapterNumber}/outline`
  );
}

/**
 * 创建/更新章节细纲 (Upsert)
 */
export async function upsertChapterOutline(
  projectId: string,
  chapterNumber: number,
  data: ChapterOutlineCreate
) {
  return apiClient.put<ChapterOutlineRead>(
    `/projects/${projectId}/chapters/${chapterNumber}/outline`,
    data
  );
}

/**
 * 删除章节细纲
 */
export async function deleteChapterOutline(
  projectId: string,
  chapterNumber: number
) {
  return apiClient.delete<void>(
    `/projects/${projectId}/chapters/${chapterNumber}/outline`
  );
}

/**
 * 异步生成章节细纲
 *
 * 返回任务 ID，需要轮询任务状态获取结果
 */
export async function generateChapterOutline(
  projectId: string,
  chapterNumber: number,
  params?: GenerateChapterOutlineParams
) {
  return apiClient.post<GenerateChapterOutlineResponse>(
    `/projects/${projectId}/chapters/${chapterNumber}/outline/generate`,
    params?.prompt ? { prompt: params.prompt } : undefined
  );
}
