/**
 * 项目列表相关 hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects, deleteProject, getProject } from "@/lib/api/projects";
import type { ProjectList, ProjectStatus } from "@/types/api";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params?: { skip?: number; limit?: number; status?: string }) =>
    [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
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
