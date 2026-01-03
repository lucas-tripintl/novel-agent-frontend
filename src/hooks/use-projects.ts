/**
 * 项目列表相关 hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProjects,
  deleteProject,
  getProject,
  listChapters,
  listGoldenFingers,
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
  chapters: (projectId: string, params?: { skip?: number; limit?: number }) =>
    [...projectKeys.detail(projectId), "chapters", params] as const,
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

/**
 * 获取项目章节列表
 */
export function useProjectChapters(
  projectId: string,
  params?: {
    skip?: number;
    limit?: number;
  },
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: projectKeys.chapters(projectId, params),
    queryFn: () => listChapters(projectId, params),
    enabled: enabled && !!projectId,
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
