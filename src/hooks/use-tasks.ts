/**
 * 任务管理相关 hooks
 *
 * 使用 React Query 实现任务列表轮询和状态管理
 */

import { useEffect, useRef } from "react";
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
import { useWritingStore } from "@/stores/writing-store";
import { outlineKeys, projectTaskKeys } from "./use-outlines";
import { chapterOutlineKeys } from "./use-chapter-outline";

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

/** 任务类型与需要刷新的数据映射 */
const TASK_TYPE_REFRESH_MAP: Record<string, string[]> = {
  generate_novel_outline: ["outlines"],
  generate_volume_outline: ["outlines"],
  generate_chapter_outline: ["outlines", "chapterOutlines"],
  write_chapter: ["chapters", "chapterOutlines"],
};

/**
 * 获取项目任务列表（带自动轮询）
 * - 有进行中任务时：每 3 秒轮询
 * - 全部完成时：停止轮询
 * - 任务完成时自动刷新相关数据
 */
export function useTasks(
  projectId: string | null,
  options?: {
    status?: TaskStatus;
    enabled?: boolean;
  }
) {
  const { status, enabled = true } = options ?? {};
  const queryClient = useQueryClient();

  // 记录上一次的任务状态，用于检测状态变化
  const prevTaskStatesRef = useRef<Map<string, TaskStatus>>(new Map());

  const query = useQuery({
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

  // 检测任务状态变化，刷新相关数据
  useEffect(() => {
    const tasks = query.data?.items;
    if (!tasks || !projectId) return;

    const prevStates = prevTaskStatesRef.current;
    const newStates = new Map<string, TaskStatus>();

    for (const task of tasks) {
      newStates.set(task.id, task.status);
      const prevStatus = prevStates.get(task.id);

      // 检测任务完成：
      // 1. 从 running/queued 变为 completed（状态变化）
      // 2. 首次出现就是 completed（任务完成很快的情况）
      const isNewlyCompleted =
        task.status === "completed" &&
        prevStatus !== "completed";

      if (isNewlyCompleted) {
        // 根据任务类型刷新相关数据
        const refreshTypes = TASK_TYPE_REFRESH_MAP[task.job_type];
        if (refreshTypes?.includes("outlines")) {
          // 刷新大纲相关缓存
          queryClient.invalidateQueries({ queryKey: outlineKeys.summary(projectId) });
          queryClient.invalidateQueries({ queryKey: outlineKeys.novel(projectId) });
          queryClient.invalidateQueries({ queryKey: outlineKeys.volumes(projectId) });
          queryClient.invalidateQueries({ queryKey: projectTaskKeys.summary(projectId) });
        }
        if (refreshTypes?.includes("chapterOutlines")) {
          // 刷新章节细纲缓存
          // 确保 chapterNumber 是数字类型（API 可能返回字符串）
          const rawChapterNumber = task.meta?.chapter_number;
          const chapterNumber = rawChapterNumber ? Number(rawChapterNumber) : undefined;
          const queryKey = chapterNumber
            ? chapterOutlineKeys.detail(projectId, chapterNumber)
            : null;
          console.log("[useTasks] 刷新细纲缓存:", {
            taskId: task.id,
            jobType: task.job_type,
            rawChapterNumber,
            chapterNumber,
            projectId,
            queryKey,
          });
          // 刷新所有细纲列表
          queryClient.invalidateQueries({ queryKey: chapterOutlineKeys.lists() });
          // 精确刷新指定章节的细纲
          if (chapterNumber && queryKey) {
            // 使缓存无效，触发活跃查询重新获取
            // 注意：不使用 exact: true，因为 React Query 需要比较整个数组
            queryClient.invalidateQueries({
              queryKey,
              refetchType: "all",
            });
            console.log("[useTasks] 已触发细纲缓存失效:", {
              queryKey,
              queryKeyStr: JSON.stringify(queryKey),
            });
          }
        }
        if (refreshTypes?.includes("chapters")) {
          // 刷新章节列表缓存
          queryClient.invalidateQueries({ queryKey: ["chapters", projectId] });
          // 精确刷新指定章节的详情
          const chapterNumber = task.meta?.chapter_number as number | undefined;
          if (chapterNumber) {
            queryClient.invalidateQueries({
              queryKey: ["chapter", projectId, chapterNumber],
            });
          }
        }

        // 任务完成后自动切换 Tab
        const { setActiveEditorTab, chapterNumber: currentChapterNumber } = useWritingStore.getState();
        const taskChapterNumber = task.meta?.chapter_number as number | undefined;
        if (taskChapterNumber === currentChapterNumber) {
          if (task.job_type === "generate_chapter_outline") {
            setActiveEditorTab("outline");
          } else if (task.job_type === "write_chapter") {
            setActiveEditorTab("content");
          }
        }
      }
    }

    prevTaskStatesRef.current = newStates;
  }, [query.data?.items, projectId, queryClient]);

  return query;
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
