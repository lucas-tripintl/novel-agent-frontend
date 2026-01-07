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
  GoldenFingerRead,
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

export interface ProjectUpdateData {
  name?: string;
  description?: string;
  status?: "active" | "archived" | "completed";
}

export async function updateProject(projectId: string, data: ProjectUpdateData) {
  return apiClient.patch<ProjectRead>(`/projects/${projectId}`, data);
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

export interface ChapterCreateData {
  chapter_number: number;
  title?: string;
  content?: string;
  status?: "draft" | "imported" | "outlined" | "drafted" | "reviewed" | "published";
}

export async function createChapter(
  projectId: string,
  data: ChapterCreateData
) {
  return apiClient.post<ChapterRead>(
    `/projects/${projectId}/chapters`,
    data
  );
}

export interface ChapterUpdateData {
  title?: string;
  content?: string;
  summary?: string;
  status?: "imported" | "outlined" | "drafted" | "reviewed" | "published";
}

export async function updateChapter(
  projectId: string,
  chapterNumber: number,
  data: ChapterUpdateData
) {
  return apiClient.patch<ChapterRead>(
    `/projects/${projectId}/chapters/${chapterNumber}`,
    data
  );
}

export async function deleteChapter(
  projectId: string,
  chapterNumber: number,
  params?: { keep_outline?: boolean }
) {
  return apiClient.delete(
    `/projects/${projectId}/chapters/${chapterNumber}`,
    { params }
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
      auto_extract_patterns: config.auto_extract_patterns ?? false,
    }
  );
}

export async function extractPatterns(projectId: string) {
  return apiClient.post<SuccessResponse<TaskCreateResponse>>(
    `/projects/${projectId}/extract-patterns`
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

/**
 * 跨项目查询实体
 * project_ids 可选，不传时返回用户所有项目的实体
 */
export async function listEntitiesCrossProject(params?: {
  project_ids?: string[];
  entity_type?: EntityType;
  keyword?: string;
  skip?: number;
  limit?: number;
}) {
  return apiClient.get<PaginatedResponse<EntityRead>>("/entities", {
    params: params as unknown as Record<string, string | number | boolean | undefined>,
  });
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

export async function deleteEntity(projectId: string, entityId: string) {
  return apiClient.delete(`/projects/${projectId}/entities/${entityId}`);
}

export interface EntityCreateData {
  entity_type: EntityType;
  name: string;
  content: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export async function createEntity(
  projectId: string,
  data: EntityCreateData
) {
  return apiClient.post<EntityRead>(
    `/projects/${projectId}/entities`,
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

export async function getGoldenFinger(projectId: string, name: string) {
  return apiClient.get<GoldenFingerRead>(
    `/projects/${projectId}/golden-fingers/${encodeURIComponent(name)}`
  );
}

export interface GoldenFingerUpdateData {
  name?: string;
  gf_type?: string;
  status?: "active" | "inactive" | "sealed";
  level?: number;
  content?: string;
  abilities?: string[];
  resources?: Record<string, string | number>;
  unlock_conditions?: string[];
  restrictions?: string[];
  tags?: string[];
}

export async function updateGoldenFinger(
  projectId: string,
  name: string,
  data: GoldenFingerUpdateData
) {
  return apiClient.patch<GoldenFingerRead>(
    `/projects/${projectId}/golden-fingers/${encodeURIComponent(name)}`,
    data
  );
}

export async function deleteGoldenFinger(projectId: string, name: string) {
  return apiClient.delete(
    `/projects/${projectId}/golden-fingers/${encodeURIComponent(name)}`
  );
}
