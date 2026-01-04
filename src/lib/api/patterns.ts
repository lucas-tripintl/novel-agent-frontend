/**
 * 抽象模式 API
 * 对应后端 /api/v1/patterns 接口
 *
 * 抽象模式是从已分析项目中提取的高层模式，包括：
 * - 力量体系模式 (power_system)
 * - 剧情模式 (plotline/plot_pattern)
 * - 角色原型 (character_archetype)
 * - 世界观模式 (worldview)
 */

import { apiClient } from "./client";
import type { PaginatedResponse, EntityType } from "@/types/api";
import type { PatternRead } from "@/types/pattern";

/**
 * 抽象模式查询参数
 */
export interface PatternsParams {
  /** 实体类型筛选 */
  entity_type?: EntityType;
  /** 名称关键字 */
  keyword?: string;
  /** 来源项目 ID */
  source_project_id?: string;
  /** 跳过数量 */
  skip?: number;
  /** 返回数量限制 (1-100) */
  limit?: number;
  /** 排序字段 */
  order_by?: "created_at" | "updated_at" | "name";
  /** 排序方向 */
  order?: "asc" | "desc";
}

/**
 * 获取抽象模式列表
 *
 * 返回从已分析项目中提取的抽象模式
 */
export async function listPatterns(params: PatternsParams = {}) {
  return apiClient.get<PaginatedResponse<PatternRead>>("/patterns", {
    params: {
      entity_type: params.entity_type,
      keyword: params.keyword,
      source_project_id: params.source_project_id,
      skip: params.skip,
      limit: params.limit,
      order_by: params.order_by,
      order: params.order,
    },
  });
}

/**
 * 获取单个抽象模式详情
 */
export async function getPattern(patternId: string) {
  return apiClient.get<PatternRead>(`/patterns/${patternId}`);
}

/**
 * 更新抽象模式数据
 */
export interface PatternUpdateData {
  name?: string;
  content?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export async function updatePattern(
  patternId: string,
  data: PatternUpdateData
) {
  return apiClient.patch<PatternRead>(`/patterns/${patternId}`, data);
}
