/**
 * 大纲相关 hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOutlinesSummary,
  getNovelOutline,
  listVolumeOutlines,
  getVolumeOutline,
  getCurrentVolumeOutline,
  getProjectTasksSummary,
  getProjectActiveTasks,
} from "@/lib/api/outlines";
import {
  generateNovelOutline,
  generateVolumeOutline,
  generateChapterOutline,
} from "@/lib/api/pipelines";
import type {
  GenerateNovelOutlineParams,
  GenerateVolumeOutlineParams,
  GenerateChapterOutlineParams,
} from "@/types/api";
import { useTaskPanelActions } from "@/stores/task-store";
import { taskKeys } from "./use-tasks";

// ============ Query Keys ============

export const outlineKeys = {
  all: ["outlines"] as const,
  summary: (projectId: string) => [...outlineKeys.all, "summary", projectId] as const,
  novel: (projectId: string) => [...outlineKeys.all, "novel", projectId] as const,
  volumes: (projectId: string) => [...outlineKeys.all, "volumes", projectId] as const,
  volume: (projectId: string, volumeNumber: number) =>
    [...outlineKeys.all, "volume", projectId, volumeNumber] as const,
  currentVolume: (projectId: string, chapterNumber: number) =>
    [...outlineKeys.all, "currentVolume", projectId, chapterNumber] as const,
};

export const projectTaskKeys = {
  all: ["projectTasks"] as const,
  summary: (projectId: string) => [...projectTaskKeys.all, "summary", projectId] as const,
  active: (projectId: string) => [...projectTaskKeys.all, "active", projectId] as const,
};

// ============ 大纲查询 Hooks ============

/**
 * 获取大纲状态汇总
 */
export function useOutlinesSummary(projectId: string | null) {
  return useQuery({
    queryKey: outlineKeys.summary(projectId ?? ""),
    queryFn: () => getOutlinesSummary(projectId!),
    enabled: !!projectId,
  });
}

/**
 * 获取总纲
 */
export function useNovelOutline(projectId: string | null) {
  return useQuery({
    queryKey: outlineKeys.novel(projectId ?? ""),
    queryFn: () => getNovelOutline(projectId!),
    enabled: !!projectId,
  });
}

/**
 * 获取卷纲列表
 */
export function useVolumeOutlines(projectId: string | null) {
  return useQuery({
    queryKey: outlineKeys.volumes(projectId ?? ""),
    queryFn: () => listVolumeOutlines(projectId!, { limit: 100 }),
    enabled: !!projectId,
  });
}

/**
 * 获取指定卷纲
 */
export function useVolumeOutline(
  projectId: string | null,
  volumeNumber: number | null
) {
  return useQuery({
    queryKey: outlineKeys.volume(projectId ?? "", volumeNumber ?? 0),
    queryFn: () => getVolumeOutline(projectId!, volumeNumber!),
    enabled: !!projectId && volumeNumber !== null && volumeNumber > 0,
  });
}

/**
 * 根据章节号获取当前卷纲
 */
export function useCurrentVolumeOutline(
  projectId: string | null,
  chapterNumber: number | null
) {
  return useQuery({
    queryKey: outlineKeys.currentVolume(projectId ?? "", chapterNumber ?? 0),
    queryFn: () => getCurrentVolumeOutline(projectId!, chapterNumber!),
    enabled: !!projectId && chapterNumber !== null && chapterNumber > 0,
  });
}

// ============ 项目任务 Hooks ============

/**
 * 获取项目任务汇总
 */
export function useProjectTasksSummary(projectId: string | null) {
  return useQuery({
    queryKey: projectTaskKeys.summary(projectId ?? ""),
    queryFn: () => getProjectTasksSummary(projectId!),
    enabled: !!projectId,
  });
}

/**
 * 获取项目进行中的任务（带轮询）
 */
export function useProjectActiveTasks(projectId: string | null) {
  return useQuery({
    queryKey: projectTaskKeys.active(projectId ?? ""),
    queryFn: () => getProjectActiveTasks(projectId!),
    enabled: !!projectId,
    // 有进行中任务时自动轮询
    refetchInterval: (query) => {
      const tasks = query.state.data;
      if (!tasks || tasks.length === 0) return false;
      return 3000; // 3秒轮询
    },
    refetchOnWindowFocus: true,
  });
}

// ============ 大纲生成 Mutations ============

/**
 * 生成总纲
 */
export function useGenerateNovelOutline(projectId: string) {
  const queryClient = useQueryClient();
  const { setExpanded, setHasNewTask } = useTaskPanelActions();

  return useMutation({
    mutationFn: (params: GenerateNovelOutlineParams) =>
      generateNovelOutline(projectId, params),
    onSuccess: () => {
      // 刷新任务列表
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      // 展开任务面板
      setExpanded(true);
      setHasNewTask(true);
    },
  });
}

/**
 * 生成卷纲
 */
export function useGenerateVolumeOutline(projectId: string) {
  const queryClient = useQueryClient();
  const { setExpanded, setHasNewTask } = useTaskPanelActions();

  return useMutation({
    mutationFn: (params: GenerateVolumeOutlineParams) =>
      generateVolumeOutline(projectId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      setExpanded(true);
      setHasNewTask(true);
    },
  });
}

/**
 * 生成章节细纲
 */
export function useGenerateChapterOutline(projectId: string) {
  const queryClient = useQueryClient();
  const { setExpanded, setHasNewTask } = useTaskPanelActions();

  return useMutation({
    mutationFn: (params: GenerateChapterOutlineParams) =>
      generateChapterOutline(projectId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      setExpanded(true);
      setHasNewTask(true);
    },
  });
}
