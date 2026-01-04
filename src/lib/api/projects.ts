/**
 * 项目相关 API
 */

import { apiClient } from "./client";
import type {
  SuccessResponse,
  PaginatedResponse,
  ProjectImportResponse,
  ProjectRead,
  ProjectList,
  ChapterRead,
  EntityRead,
  EntityType,
  GoldenFingerListItem,
  StyleRead,
  TaskCreateResponse,
  AnalyzeRequest,
  AnalysisType,
  StyleAnalyzeRequest,
  SynthesizeRequest,
} from "@/types/api";

// ============ 项目 CRUD ============

export async function listProjects(params?: {
  skip?: number;
  limit?: number;
  status?: string;
}) {
  return apiClient.get<PaginatedResponse<ProjectList>>("/projects", { params });
}

export async function getProject(projectId: string) {
  return apiClient.get<ProjectRead>(`/projects/${projectId}`);
}

export async function importProject(data: {
  file: File;
  project_name?: string;
  start_chapter?: number;
  end_chapter?: number;
}) {
  const formData = new FormData();
  formData.append("file", data.file);

  const params: Record<string, string | number | undefined> = {};
  if (data.project_name) params.project_name = data.project_name;
  if (data.start_chapter) params.start_chapter = data.start_chapter;
  if (data.end_chapter) params.end_chapter = data.end_chapter;

  return apiClient.post<SuccessResponse<ProjectImportResponse>>(
    "/projects/import",
    formData,
    { params }
  );
}

export async function deleteProject(projectId: string) {
  return apiClient.delete(`/projects/${projectId}`);
}

// ============ 章节 ============

export type ChapterSortOrder = "asc" | "desc";

export async function listChapters(
  projectId: string,
  params?: { skip?: number; limit?: number; order?: ChapterSortOrder }
) {
  return apiClient.get<PaginatedResponse<ChapterRead>>(
    `/projects/${projectId}/chapters`,
    { params }
  );
}

export async function getChapter(projectId: string, chapterNumber: number) {
  return apiClient.get<ChapterRead>(
    `/projects/${projectId}/chapters/${chapterNumber}`
  );
}

// ============ 分析 ============

export async function analyzeProject(
  projectId: string,
  config: AnalyzeRequest
) {
  return apiClient.post<SuccessResponse<TaskCreateResponse>>(
    `/projects/${projectId}/analyze`,
    {
      analysis_types: config.analysis_types,
      start_chapter: config.start_chapter ?? 1,
      end_chapter: config.end_chapter,
      force: config.force ?? false,
    }
  );
}

export { type AnalysisType };

export async function synthesizeWorldview(
  projectId: string,
  config: SynthesizeRequest = {}
) {
  return apiClient.post<SuccessResponse<TaskCreateResponse>>(
    `/projects/${projectId}/synthesize`,
    config
  );
}

export async function analyzeStyle(
  projectId: string,
  config: StyleAnalyzeRequest = {}
) {
  return apiClient.post<SuccessResponse<TaskCreateResponse>>(
    `/projects/${projectId}/style/analyze`,
    {
      sample_chapters: config.sample_chapters ?? 10,
    }
  );
}

export async function getStyle(projectId: string) {
  return apiClient.get<StyleRead>(`/projects/${projectId}/style`);
}

// ============ 实体 ============

export async function listEntities(
  projectId: string,
  params?: {
    entity_type?: EntityType;
    status?: string;
    keyword?: string;
    skip?: number;
    limit?: number;
  }
) {
  return apiClient.get<PaginatedResponse<EntityRead>>(
    `/projects/${projectId}/entities`,
    { params }
  );
}

export async function getEntity(projectId: string, entityId: string) {
  return apiClient.get<EntityRead>(`/projects/${projectId}/entities/${entityId}`);
}

export interface EntityUpdateData {
  name?: string;
  content?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export async function updateEntity(
  projectId: string,
  entityId: string,
  data: EntityUpdateData
) {
  return apiClient.patch<EntityRead>(
    `/projects/${projectId}/entities/${entityId}`,
    data
  );
}

// ============ 金手指 ============

export async function listGoldenFingers(
  projectId: string,
  params?: { skip?: number; limit?: number }
) {
  return apiClient.get<PaginatedResponse<GoldenFingerListItem>>(
    `/projects/${projectId}/golden-fingers`,
    { params }
  );
}
