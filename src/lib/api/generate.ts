/**
 * 生成设定 API
 */

import { apiClient } from "./client";
import type { EntityType } from "@/types/api";

export interface GenerateEntityRequest {
  entity_type: EntityType;
  category?: string;
  guidance?: string;
  reference_ids?: {
    entity_ids?: string[];
    outline_id?: string;
    skill_ids?: string[];
  };
}

export interface GenerateEntityResponse {
  success: boolean;
  data: {
    name: string;
    entity_type: string;
    content: string; // Markdown
  };
}

export async function generateEntity(
  projectId: string,
  params: GenerateEntityRequest
): Promise<GenerateEntityResponse> {
  return apiClient.post<GenerateEntityResponse>(
    `/projects/${projectId}/generate`,
    params
  );
}
