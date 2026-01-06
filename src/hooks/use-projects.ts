/**
 * 项目列表相关 hooks
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  listProjects,
  deleteProject,
  updateProject,
  getProject,
  listChapters,
  getChapter,
  updateChapter,
  deleteChapter,
  listGoldenFingers,
  updateGoldenFinger,
  deleteGoldenFinger,
  deleteEntity,
  type ChapterSortOrder,
  type ProjectUpdateData,
  type ChapterUpdateData,
  type GoldenFingerUpdateData,
} from "@/lib/api/projects";
import type { ProjectList, ProjectStatus } from "@/types/api";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params?: { skip?: number; limit?: number; status?: string }) =>
    [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  chapters: (projectId: string, params?: { order?: ChapterSortOrder }) =>
    [...projectKeys.detail(projectId), "chapters", params] as const,
  chapter: (projectId: string, chapterNumber: number) =>
    [...projectKeys.detail(projectId), "chapter", chapterNumber] as const,
  goldenFingers: (projectId: string, params?: { skip?: number; limit?: number }) =>
    [...projectKeys.detail(projectId), "goldenFingers", params] as const,
};

/**
 * 获取项目列表
 */
export function useProjects(params?: {
  skip?: number;
  limit?: number;
  status?: ProjectStatus;
}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => listProjects(params),
  });
}

/**
 * 获取单个项目详情
 */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  });
}

const CHAPTERS_PAGE_SIZE = 20;

/**
 * 获取项目章节列表（无限滚动）
 */
export function useProjectChapters(
  projectId: string,
  params?: {
    order?: ChapterSortOrder;
  },
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};
  const order = params?.order ?? "desc"; // 默认按最新排序

  return useInfiniteQuery({
    queryKey: projectKeys.chapters(projectId, { order }),
    queryFn: ({ pageParam = 0 }) =>
      listChapters(projectId, {
        skip: pageParam,
        limit: CHAPTERS_PAGE_SIZE,
        order,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.items.length, 0);
      if (loadedCount >= lastPage.total) {
        return undefined; // 没有更多数据
      }
      return loadedCount;
    },
    enabled: enabled && !!projectId,
  });
}

/**
 * 获取单个章节详情（包含正文内容）
 */
export function useChapter(
  projectId: string,
  chapterNumber: number,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: projectKeys.chapter(projectId, chapterNumber),
    queryFn: () => getChapter(projectId, chapterNumber),
    enabled: enabled && !!projectId && chapterNumber > 0,
  });
}

/**
 * 获取项目金手指列表
 */
export function useProjectGoldenFingers(
  projectId: string,
  params?: {
    skip?: number;
    limit?: number;
  },
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: projectKeys.goldenFingers(projectId, params),
    queryFn: () => listGoldenFingers(projectId, params),
    enabled: enabled && !!projectId,
  });
}

/**
 * 删除项目
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      // 删除成功后刷新项目列表
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * 更新项目
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: ProjectUpdateData }) =>
      updateProject(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * 更新章节
 */
export function useUpdateChapter(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chapterNumber, data }: { chapterNumber: number; data: ChapterUpdateData }) =>
      updateChapter(projectId, chapterNumber, data),
    onSuccess: (_, { chapterNumber }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.chapters(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.chapter(projectId, chapterNumber) });
    },
  });
}

/**
 * 删除章节
 */
export function useDeleteChapter(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chapterNumber, keepOutline }: { chapterNumber: number; keepOutline?: boolean }) =>
      deleteChapter(projectId, chapterNumber, { keep_outline: keepOutline }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.chapters(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

/**
 * 删除实体
 */
export function useDeleteEntity(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entityId: string) => deleteEntity(projectId, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-elements", projectId] });
    },
  });
}

/**
 * 更新金手指
 */
export function useUpdateGoldenFinger(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: GoldenFingerUpdateData }) =>
      updateGoldenFinger(projectId, name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.goldenFingers(projectId) });
    },
  });
}

/**
 * 删除金手指
 */
export function useDeleteGoldenFinger(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteGoldenFinger(projectId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.goldenFingers(projectId) });
    },
  });
}

/**
 * 生成项目颜色（基于项目 ID 的哈希）
 */
export function getProjectColor(projectId: string): string {
  const colors = [
    "#22c55e", // green
    "#a855f7", // purple
    "#06b6d4", // cyan
    "#f97316", // orange
    "#ec4899", // pink
    "#3b82f6", // blue
    "#eab308", // yellow
    "#ef4444", // red
  ];

  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash) + projectId.charCodeAt(i);
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * 将 ProjectList 转换为通用格式（用于 NovelFilter 等组件）
 */
export function projectToNovel(project: ProjectList) {
  return {
    id: project.id,
    title: project.name,
    color: getProjectColor(project.id),
  };
}
