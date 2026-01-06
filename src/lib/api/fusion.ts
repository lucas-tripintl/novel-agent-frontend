/**
 * 融合任务 API
 * 对应后端 /api/v1/fusion 接口
 */

import { apiClient } from "./client";
import type { PaginatedResponse, SuccessResponse, TaskCreateResponse, FusionBuildResponse } from "@/types/api";
import type {
  FusionTaskRead,
  FusionTaskList,
  FusionModeRead,
  FusionCandidateRead,
  FusionTaskCreateRequest,
  FusionSelectRequest,
  FusionBuildRequest,
  FusionStatus,
} from "@/types/fusion";

// ============ 融合模式 ============

/**
 * 获取所有可用的融合模式
 */
export async function listFusionModes() {
  const response = await apiClient.get<SuccessResponse<FusionModeRead[]>>("/fusion/modes");
  return response.data;
}

// ============ 融合任务 ============

export interface FusionTasksParams {
  status?: FusionStatus;
  skip?: number;
  limit?: number;
}

/**
 * 获取融合任务列表
 */
export async function listFusionTasks(params: FusionTasksParams = {}) {
  return apiClient.get<PaginatedResponse<FusionTaskList>>("/fusion/tasks", {
    params: {
      status: params.status,
      skip: params.skip,
      limit: params.limit,
    },
  });
}

/**
 * 创建融合任务
 */
export async function createFusionTask(request: FusionTaskCreateRequest) {
  const response = await apiClient.post<SuccessResponse<FusionTaskRead>>(
    "/fusion/tasks",
    request
  );
  return response.data;
}

/**
 * 获取融合任务详情
 */
export async function getFusionTask(taskId: string) {
  const response = await apiClient.get<SuccessResponse<FusionTaskRead>>(
    `/fusion/tasks/${taskId}`
  );
  return response.data;
}

/**
 * 更新融合任务
 */
export interface FusionTaskUpdateData {
  fusion_mode?: string;
  custom_instruction?: string;
  user_ideas?: string;
  candidate_count?: number;
}

export async function updateFusionTask(taskId: string, data: FusionTaskUpdateData) {
  const response = await apiClient.patch<SuccessResponse<FusionTaskRead>>(
    `/fusion/tasks/${taskId}`,
    data
  );
  return response.data;
}

/**
 * 删除融合任务
 */
export async function deleteFusionTask(taskId: string) {
  return apiClient.delete(`/fusion/tasks/${taskId}`);
}

// ============ 融合流程 ============

/**
 * 运行融合流水线（提取 + 融合）
 */
export async function runFusionPipeline(taskId: string) {
  const response = await apiClient.post<SuccessResponse<TaskCreateResponse>>(
    `/fusion/tasks/${taskId}/run`
  );
  return response.data;
}

/**
 * 获取融合候选方案列表
 */
export async function listFusionCandidates(taskId: string) {
  const response = await apiClient.get<SuccessResponse<FusionCandidateRead[]>>(
    `/fusion/tasks/${taskId}/candidates`
  );
  return response.data;
}

/**
 * 选择候选方案
 */
export async function selectFusionCandidate(taskId: string, request: FusionSelectRequest) {
  const response = await apiClient.post<SuccessResponse<FusionTaskRead>>(
    `/fusion/tasks/${taskId}/select`,
    request
  );
  return response.data;
}

/**
 * 基于候选方案创建项目（直接返回 project_id）
 */
export async function buildFusionProject(taskId: string, request: FusionBuildRequest) {
  const response = await apiClient.post<SuccessResponse<FusionBuildResponse>>(
    `/fusion/tasks/${taskId}/build`,
    request
  );
  return response.data;
}
