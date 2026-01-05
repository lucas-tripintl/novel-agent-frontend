/**
 * 技能系统类型定义
 */

// ============ 枚举定义 ============

/** 技能分类 */
export type SkillCategory =
  | "platform_style"  // 平台风格
  | "rhythm"          // 节奏控制
  | "technique"       // 写作技巧
  | "anti_ai"         // 去AI味
  | "other";          // 其他

/** 适用阶段 */
export type SkillStage =
  | "outline"          // 大纲规划
  | "chapter_outline"  // 章节细纲
  | "writing"          // 首次写作
  | "rewriting"        // 改写润色
  | "review";          // 一致性审核

/** 技能可见性/来源 */
export type SkillVisibility =
  | "system"  // 系统预置
  | "team";   // 用户自建

/** 技能列表排序字段 */
export type SkillSortBy =
  | "updated_at"   // 更新时间
  | "created_at"   // 创建时间
  | "downloads"    // 下载量
  | "rating"       // 评分
  | "name";        // 名称

/** 排序方向 */
export type SortOrder = "asc" | "desc";

// ============ 技能库 ============

/** 技能简要信息（列表展示用） */
export interface SkillBrief {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  applicable_stages: SkillStage[];
  visibility: SkillVisibility;
  is_featured: boolean;
}

/** 技能完整信息 */
export interface SkillRead {
  id: string;
  name: string;
  description: string;
  content: string;  // Markdown 格式的完整内容
  category: SkillCategory;
  applicable_stages: SkillStage[];
  tags: string[];
  visibility: SkillVisibility;
  owner_team_id: string | null;
  author_id: string | null;
  downloads: number;
  rating: number;
  version: string;
  is_featured: boolean;
  created_at: string;
}

/** 创建技能请求 */
export interface SkillCreate {
  name: string;
  description: string;
  content: string;
  category: SkillCategory;
  applicable_stages: SkillStage[];
  tags?: string[];
}

/** 更新技能请求（所有字段可选） */
export interface SkillUpdate {
  name?: string;
  description?: string;
  content?: string;
  category?: SkillCategory;
  applicable_stages?: SkillStage[];
  tags?: string[];
}

// ============ 项目技能配置 ============

/** 项目技能配置 */
export interface ProjectSkillRead {
  id: number;
  skill_id: string;
  skill_name: string;
  skill_description: string;
  skill_category: SkillCategory;
  stage: SkillStage | null;  // null 表示所有阶段生效
  order: number;
  is_enabled: boolean;
}

/** 启用技能请求 */
export interface EnableSkillRequest {
  skill_id: string;
  stage?: SkillStage | null;  // 可选，null=所有阶段
}

/** 调整技能顺序请求 */
export interface ReorderSkillsRequest {
  skill_orders: [string, number][];  // [skill_id, order][]
}

// ============ 查询参数 ============

/** 技能列表查询参数 */
export interface SkillListParams {
  category?: SkillCategory;
  stage?: SkillStage;
  visibility?: SkillVisibility;
  keyword?: string;
  sort_by?: SkillSortBy;
  sort_order?: SortOrder;
  skip?: number;
  limit?: number;
}

/** 项目技能查询参数 */
export interface ProjectSkillListParams {
  stage?: SkillStage;
}
