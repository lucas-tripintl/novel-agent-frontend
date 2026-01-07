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

/** 任务追踪状态，用于检测状态变化 */
interface TaskTrackingState {
  status: TaskStatus;
  chapterReady?: boolean;
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

  // 记录上一次的任务状态，用于检测状态变化（包括 chapter_ready）
  const prevTaskStatesRef = useRef<Map<string, TaskTrackingState>>(new Map());

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
    const newStates = new Map<string, TaskTrackingState>();

    for (const task of tasks) {
      const prevState = prevStates.get(task.id);
      const currentChapterReady = task.meta?.chapter_ready === true;

      // 更新状态记录
      newStates.set(task.id, {
        status: task.status,
        chapterReady: currentChapterReady,
      });

      // 新增：检测 chapter_ready 首次变为 true（write_chapter 任务专用）
      // 这允许在任务完成前就展示章节内容
      const isChapterReadyNow =
        task.job_type === "write_chapter" &&
        currentChapterReady &&
        prevState?.chapterReady !== true;

      // 原有：检测 completed
      const isNewlyCompleted =
        task.status === "completed" &&
        prevState?.status !== "completed";

      // write_chapter 任务：chapter_ready 时就刷新章节 + 切换 Tab
      if (isChapterReadyNow) {
        console.log("[useTasks] 章节已就绪，提前刷新:", {
          taskId: task.id,
          chapterNumber: task.meta?.chapter_number,
          stage: task.meta?.stage,
        });
        // 刷新章节缓存
        queryClient.invalidateQueries({ queryKey: ["chapters", projectId] });
        const chapterNumber = task.meta?.chapter_number as number | undefined;
        if (chapterNumber) {
          queryClient.invalidateQueries({
            queryKey: ["chapter", projectId, chapterNumber],
          });
        }
        // 切换 Tab 到正文
        const { setActiveEditorTab, chapterNumber: currentChapterNumber } = useWritingStore.getState();
        if (chapterNumber === currentChapterNumber) {
          setActiveEditorTab("content");
        }
      }

      // 任务完成时的刷新逻辑
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
        // write_chapter 的章节刷新已在 chapter_ready 阶段处理，但如果没有 chapter_ready 则在此刷新（向后兼容）
        if (refreshTypes?.includes("chapters") && task.job_type !== "write_chapter") {
          // 非 write_chapter 任务的章节刷新
          queryClient.invalidateQueries({ queryKey: ["chapters", projectId] });
          const chapterNumber = task.meta?.chapter_number as number | undefined;
          if (chapterNumber) {
            queryClient.invalidateQueries({
              queryKey: ["chapter", projectId, chapterNumber],
            });
          }
        }
        // 向后兼容：如果 write_chapter 完成但没有触发过 chapter_ready，也刷新章节
        if (task.job_type === "write_chapter" && !prevState?.chapterReady) {
          queryClient.invalidateQueries({ queryKey: ["chapters", projectId] });
          const chapterNumber = task.meta?.chapter_number as number | undefined;
          if (chapterNumber) {
            queryClient.invalidateQueries({
              queryKey: ["chapter", projectId, chapterNumber],
            });
          }
          // 切换 Tab
          const { setActiveEditorTab, chapterNumber: currentChapterNumber } = useWritingStore.getState();
          if (chapterNumber === currentChapterNumber) {
            setActiveEditorTab("content");
          }
        }

        // 其他任务完成后自动切换 Tab
        const { setActiveEditorTab, chapterNumber: currentChapterNumber } = useWritingStore.getState();
        const taskChapterNumber = task.meta?.chapter_number as number | undefined;
        if (taskChapterNumber === currentChapterNumber) {
          if (task.job_type === "generate_chapter_outline") {
            setActiveEditorTab("outline");
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
