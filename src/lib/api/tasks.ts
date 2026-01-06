/**
 * 任务相关 API
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  TaskRead,
  TaskStatus,
  CancelTaskResponse,
} from "@/types/api";

export interface ListTasksParams {
  project_id?: string;
  status?: TaskStatus;
  skip?: number;
  limit?: number;
}

/**
 * 获取任务列表
 * GET /api/v1/tasks
 */
export async function listTasks(
  params?: ListTasksParams
): Promise<PaginatedResponse<TaskRead>> {
  return apiClient.get<PaginatedResponse<TaskRead>>("/tasks", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * 获取单个任务详情
 * GET /api/v1/tasks/{task_id}
 */
export async function getTask(taskId: string): Promise<TaskRead> {
  return apiClient.get<TaskRead>(`/tasks/${taskId}`);
}

/**
 * 取消任务
 * 只有 queued 和 running 状态的任务可取消
 * POST /api/v1/tasks/{task_id}/cancel
 */
export async function cancelTask(taskId: string): Promise<CancelTaskResponse> {
  return apiClient.post<CancelTaskResponse>(`/tasks/${taskId}/cancel`);
}
