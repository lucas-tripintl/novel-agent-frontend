/**
 * 跨项目实体 API
 * 对应后端 /api/v1/entities 接口
 */

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  EntityRead,
  EntityType,
  EntityStatus,
  SourceType,
} from "@/types/api";

/**
 * 跨项目实体查询参数
 */
export interface CrossProjectEntitiesParams {
  /** 项目 ID 列表（必填，至少1个） */
  project_ids: string[];
  /** 实体类型过滤 */
  entity_type?: EntityType;
  /** 来源类型过滤 */
  source_type?: SourceType;
  /** 实体状态过滤 */
  status?: EntityStatus;
  /** 标签过滤（任一匹配） */
  tags?: string[];
  /** 名称/内容关键字 */
  keyword?: string;
  /** 跳过数量 */
  skip?: number;
  /** 返回数量限制 */
  limit?: number;
  /** 排序字段 */
  order_by?: "created_at" | "updated_at" | "name";
  /** 排序方向 */
  order?: "asc" | "desc";
}

/**
 * 跨项目查询实体列表
 *
 * 使用 /api/v1/entities 接口，一次请求获取多个项目的实体
 * 比多次调用 /api/v1/projects/{id}/entities 更高效
 */
export async function listEntitiesCrossProject(
  params: CrossProjectEntitiesParams
) {
  const { project_ids, ...rest } = params;

  // 构建查询参数，project_ids 作为重复参数传递
  const queryParams = new URLSearchParams();
  project_ids.forEach((id) => queryParams.append("project_ids", id));

  // 添加其他参数
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, String(v)));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  return apiClient.get<PaginatedResponse<EntityRead>>(
    `/entities?${queryParams.toString()}`
  );
}

/**
 * 批量获取多种类型的实体（用于总览页面）
 *
 * 返回按类型分组的实体统计
 */
export async function getEntitiesOverview(projectIds: string[]) {
  const entityTypes: EntityType[] = [
    "character",
    "location",
    "worldview",
    "faction",
    "power_system",
    "item",
    "skill",
    "plotline",
    "foreshadowing",
    "golden_finger",
  ];

  // 并行请求所有类型（每种类型只取1条用于统计total）
  const results = await Promise.all(
    entityTypes.map((type) =>
      listEntitiesCrossProject({
        project_ids: projectIds,
        entity_type: type,
        limit: 1, // 只需要 total 数量
      }).catch(() => ({ items: [], total: 0, skip: 0, limit: 1 }))
    )
  );

  // 构建统计结果
  const stats: Record<EntityType, number> = {} as Record<EntityType, number>;
  entityTypes.forEach((type, index) => {
    stats[type] = results[index].total;
  });

  return stats;
}

