/**
 * 任务相关 API
 */

import { apiClient } from "./client";
import type { PaginatedResponse, TaskRead, TaskStatus } from "@/types/api";

export async function listTasks(params?: {
  project_id?: string;
  status?: TaskStatus;
  skip?: number;
  limit?: number;
}) {
  return apiClient.get<PaginatedResponse<TaskRead>>("/tasks", { params });
}

export async function getTask(taskId: string) {
  return apiClient.get<TaskRead>(`/tasks/${taskId}`);
}

export async function cancelTask(taskId: string) {
  return apiClient.post(`/tasks/${taskId}/cancel`);
}
