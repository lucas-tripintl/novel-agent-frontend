/**
 * 任务管理相关 hooks
 *
 * 使用 React Query 实现任务列表轮询和状态管理
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTasks, getTask, cancelTask as cancelTaskApi } from "@/lib/api/tasks";
import {
  writeChapter,
  generateNovelOutline,
  generateVolumeOutline,
  generateChapterOutline,
} from "@/lib/api/pipelines";
import type {
  TaskRead,
  TaskStatus,
  WriteChapterParams,
  GenerateNovelOutlineParams,
  GenerateVolumeOutlineParams,
  GenerateChapterOutlineParams,
} from "@/types/api";
import { useTaskStore } from "@/stores/task-store";

// ============ Query Keys ============

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params?: { project_id?: string; status?: TaskStatus }) =>
    [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (taskId: string) => [...taskKeys.details(), taskId] as const,
};

// ============ 轮询配置 ============

/** 轮询间隔（毫秒） */
const POLLING_INTERVAL = 3000;

/** 判断是否有进行中的任务 */
function hasActiveTasks(tasks: TaskRead[]): boolean {
  return tasks.some((task) => task.status === "queued" || task.status === "running");
}

// ============ 查询 Hooks ============

/**
 * 获取项目任务列表（带自动轮询）
 * - 有进行中任务时：每 3 秒轮询
 * - 全部完成时：停止轮询
 */
export function useTasks(
  projectId: string | null,
  options?: {
    status?: TaskStatus;
    enabled?: boolean;
  }
) {
  const { status, enabled = true } = options ?? {};

  return useQuery({
    queryKey: taskKeys.list({ project_id: projectId ?? undefined, status }),
    queryFn: () =>
      listTasks({
        project_id: projectId ?? undefined,
        status,
        limit: 50,
      }),
    enabled: enabled && !!projectId,
    // 动态轮询：根据任务状态决定是否继续轮询
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data?.items) return false;
      return hasActiveTasks(data.items) ? POLLING_INTERVAL : false;
    },
    // 窗口聚焦时刷新
    refetchOnWindowFocus: true,
  });
}

/**
 * 获取单个任务详情
 */
export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ""),
    queryFn: () => getTask(taskId!),
    enabled: !!taskId,
    // 进行中的任务轮询
    refetchInterval: (query) => {
      const task = query.state.data;
      if (!task) return false;
      return task.status === "queued" || task.status === "running"
        ? POLLING_INTERVAL
        : false;
    },
  });
}

// ============ 变更 Hooks ============

/**
 * 取消任务
 */
export function useCancelTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => cancelTaskApi(taskId),
    onSuccess: (_, taskId) => {
      // 刷新任务列表和详情
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

/**
 * 提交章节写作任务
 */
export function useWriteChapter() {
  const queryClient = useQueryClient();
  const setHasNewTask = useTaskStore((state) => state.setHasNewTask);

  return useMutation({
    mutationFn: ({
      projectId,
      params,
    }: {
      projectId: string;
      params: WriteChapterParams;
    }) => writeChapter(projectId, params),
    onSuccess: () => {
      // 刷新任务列表
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // 标记有新任务，自动展开面板
      setHasNewTask(true);
    },
  });
}

/**
 * 生成总纲
 */
export function useGenerateNovelOutline() {
  const queryClient = useQueryClient();
  const setHasNewTask = useTaskStore((state) => state.setHasNewTask);

  return useMutation({
    mutationFn: ({
      projectId,
      params,
    }: {
      projectId: string;
      params: GenerateNovelOutlineParams;
    }) => generateNovelOutline(projectId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      setHasNewTask(true);
    },
  });
}

/**
 * 生成卷纲
 */
export function useGenerateVolumeOutline() {
  const queryClient = useQueryClient();
  const setHasNewTask = useTaskStore((state) => state.setHasNewTask);

  return useMutation({
    mutationFn: ({
      projectId,
      params,
    }: {
      projectId: string;
      params: GenerateVolumeOutlineParams;
    }) => generateVolumeOutline(projectId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      setHasNewTask(true);
    },
  });
}

/**
 * 生成章节细纲
 */
export function useGenerateChapterOutline() {
  const queryClient = useQueryClient();
  const setHasNewTask = useTaskStore((state) => state.setHasNewTask);

  return useMutation({
    mutationFn: ({
      projectId,
      params,
    }: {
      projectId: string;
      params: GenerateChapterOutlineParams;
    }) => generateChapterOutline(projectId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      setHasNewTask(true);
    },
  });
}
