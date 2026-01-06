"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTask, listTasks } from "@/lib/api/tasks";
import type { TaskRead, TaskStatus } from "@/types/api";

const POLL_INTERVAL = 5000; // 5秒轮询

/**
 * 轮询单个任务状态
 */
export function useTaskPolling(
  taskId: string | null,
  options?: {
    enabled?: boolean;
    onComplete?: (task: TaskRead) => void;
    onFailed?: (task: TaskRead) => void;
  }
) {
  const queryClient = useQueryClient();
  const { enabled = true, onComplete, onFailed } = options ?? {};

  // 使用 ref 存储回调，避免闭包陷阱
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);
  onCompleteRef.current = onComplete;
  onFailedRef.current = onFailed;

  // 追踪是否已经触发过回调，避免重复调用
  const hasCalledRef = useRef(false);

  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) throw new Error("No task ID");
      return getTask(taskId);
    },
    enabled: enabled && !!taskId,
    refetchInterval: (query) => {
      const task = query.state.data;
      if (!task) return POLL_INTERVAL;

      // 任务完成或失败时停止轮询（不在这里调用回调）
      if (task.status === "completed" || task.status === "failed" || task.status === "cancelled") {
        return false;
      }

      return POLL_INTERVAL;
    },
    staleTime: 0, // 始终重新获取
  });

  // 使用 useEffect 监听任务状态变化，触发回调
  useEffect(() => {
    const task = query.data;
    if (!task || hasCalledRef.current) return;

    if (task.status === "completed") {
      hasCalledRef.current = true;
      onCompleteRef.current?.(task);
    } else if (task.status === "failed" || task.status === "cancelled") {
      hasCalledRef.current = true;
      onFailedRef.current?.(task);
    }
  }, [query.data]);

  // taskId 变化时重置状态
  useEffect(() => {
    hasCalledRef.current = false;
  }, [taskId]);

  return query;
}

/**
 * 获取正在运行的任务列表
 */
export function useRunningTasks(projectId?: string) {
  return useQuery({
    queryKey: ["tasks", "running", projectId],
    queryFn: async () => {
      const result = await listTasks({
        project_id: projectId,
        status: "running",
        limit: 50,
      });
      return result.items;
    },
    refetchInterval: POLL_INTERVAL,
    staleTime: 0,
  });
}

/**
 * 获取排队中的任务列表
 */
export function useQueuedTasks(projectId?: string) {
  return useQuery({
    queryKey: ["tasks", "queued", projectId],
    queryFn: async () => {
      const result = await listTasks({
        project_id: projectId,
        status: "queued",
        limit: 50,
      });
      return result.items;
    },
    refetchInterval: POLL_INTERVAL,
    staleTime: 0,
  });
}

/**
 * 获取活跃任务列表（running + queued，已去重）
 */
export function useActiveTasks(projectId?: string) {
  const { data: runningTasks = [], ...runningQuery } = useRunningTasks(projectId);
  const { data: queuedTasks = [], ...queuedQuery } = useQueuedTasks(projectId);

  // 合并并去重（running 优先，避免状态切换时出现重复 key）
  const allTasks = [...runningTasks, ...queuedTasks];
  const seenIds = new Set<string>();
  const uniqueTasks = allTasks.filter((task) => {
    if (seenIds.has(task.id)) return false;
    seenIds.add(task.id);
    return true;
  });

  return {
    data: uniqueTasks,
    isLoading: runningQuery.isLoading || queuedQuery.isLoading,
    error: runningQuery.error || queuedQuery.error,
    refetch: () => {
      runningQuery.refetch();
      queuedQuery.refetch();
    },
  };
}
