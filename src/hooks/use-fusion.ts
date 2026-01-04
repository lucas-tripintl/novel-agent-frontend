/**
 * 融合任务相关 hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listFusionModes,
  listFusionTasks,
  getFusionTask,
  createFusionTask,
  deleteFusionTask,
  runFusionPipeline,
  listFusionCandidates,
  selectFusionCandidate,
  buildFusionProject,
  type FusionTasksParams,
} from "@/lib/api/fusion";
import type {
  FusionTaskCreateRequest,
  FusionSelectRequest,
  FusionBuildRequest,
} from "@/types/fusion";

// Query keys
export const fusionKeys = {
  all: ["fusion"] as const,
  modes: () => [...fusionKeys.all, "modes"] as const,
  tasks: () => [...fusionKeys.all, "tasks"] as const,
  taskList: (params?: FusionTasksParams) => [...fusionKeys.tasks(), "list", params] as const,
  taskDetails: () => [...fusionKeys.tasks(), "detail"] as const,
  taskDetail: (id: string) => [...fusionKeys.taskDetails(), id] as const,
  candidates: (taskId: string) => [...fusionKeys.all, "candidates", taskId] as const,
};

// ============ 查询 Hooks ============

/**
 * 获取融合模式列表
 */
export function useFusionModes() {
  return useQuery({
    queryKey: fusionKeys.modes(),
    queryFn: listFusionModes,
    staleTime: 1000 * 60 * 60, // 1 hour - 融合模式很少变化
  });
}

/**
 * 获取融合任务列表
 */
export function useFusionTasks(params?: FusionTasksParams) {
  return useQuery({
    queryKey: fusionKeys.taskList(params),
    queryFn: () => listFusionTasks(params),
  });
}

/**
 * 获取融合任务详情
 */
export function useFusionTask(taskId: string, options?: { enabled?: boolean; refetchInterval?: number }) {
  const { enabled = true, refetchInterval } = options ?? {};

  return useQuery({
    queryKey: fusionKeys.taskDetail(taskId),
    queryFn: () => getFusionTask(taskId),
    enabled: enabled && !!taskId,
    refetchInterval,
  });
}

/**
 * 获取融合候选方案列表
 */
export function useFusionCandidates(taskId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: fusionKeys.candidates(taskId),
    queryFn: () => listFusionCandidates(taskId),
    enabled: enabled && !!taskId,
  });
}

// ============ 变更 Hooks ============

/**
 * 创建融合任务
 */
export function useCreateFusionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: FusionTaskCreateRequest) => createFusionTask(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fusionKeys.tasks() });
    },
  });
}

/**
 * 删除融合任务
 */
export function useDeleteFusionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteFusionTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fusionKeys.tasks() });
    },
  });
}

/**
 * 运行融合流水线
 */
export function useRunFusionPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => runFusionPipeline(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: fusionKeys.taskDetail(taskId) });
      queryClient.invalidateQueries({ queryKey: fusionKeys.tasks() });
    },
  });
}

/**
 * 选择候选方案
 */
export function useSelectFusionCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, request }: { taskId: string; request: FusionSelectRequest }) =>
      selectFusionCandidate(taskId, request),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: fusionKeys.taskDetail(taskId) });
      queryClient.invalidateQueries({ queryKey: fusionKeys.tasks() });
    },
  });
}

/**
 * 基于选中方案创建项目
 */
export function useBuildFusionProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, request }: { taskId: string; request: FusionBuildRequest }) =>
      buildFusionProject(taskId, request),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: fusionKeys.taskDetail(taskId) });
      queryClient.invalidateQueries({ queryKey: fusionKeys.tasks() });
    },
  });
}
