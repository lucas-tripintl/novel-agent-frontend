/**
 * 抽象模式类型定义
 *
 * 抽象模式是从多个项目中提取的高层次写作模式
 * 对应 API 返回的 EntityRead（level=pattern）
 */

import type { EntityType, SourceType } from "./api";

/**
 * 实体抽象层级
 *
 * - instance: 具体的角色、地点（萧炎、斗气大陆）
 * - definition: 某本书的设定定义（斗气九段体系）
 * - pattern: 跨项目的抽象模式（线性等级突破模式）
 */
export type EntityLevel = "instance" | "definition" | "pattern";

/**
 * 实体状态
 */
export type EntityStatus = "pending" | "active" | "archived";

/**
 * 抽象模式读取响应
 *
 * 对应后端 EntityRead 模型（level=pattern 的实体）
 */
export interface PatternRead {
  id: string;
  name: string;
  entity_type: EntityType;
  source_type: SourceType;
  status: EntityStatus;
  tags: string[];
  /** 模式描述内容 */
  content: string | null;
  /** 模式属性（如分类、特征等） */
  attributes: Record<string, unknown>;
  /** 元数据 */
  metadata_: Record<string, unknown>;
  /** Pattern 级别实体无项目关联 */
  project_id: string | null;
  /** 所属团队 */
  owner_team_id: string | null;
  /** 所属用户 */
  owner_user_id: string | null;
  /** 实体层级 */
  level: EntityLevel;
  /** 来源实体 ID 列表（从哪些实体抽象而来） */
  source_entity_ids: string[];
  /** 覆盖的实体 ID */
  overrides_entity_id: string | null;
  /** 来源项目 ID */
  source_project_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 元素类型（用于 UI 展示）
 */
export type PatternType =
  | "power_system"
  | "plot_pattern"
  | "character_archetype"
  | "worldview"
  | "narrative_rhythm"
  | "chapter_structure"
  | "relationship_dynamic"
  | "conflict_escalation"
  | "cheat_evolution"
  | "cool_point_pattern"
  | "writing_technique"
  | "golden_opening_report";

/**
 * 模式类型标签映射
 */
export const patternTypeLabels: Record<string, string> = {
  power_system: "力量体系",
  plot_pattern: "剧情模式",
  character_archetype: "角色原型",
  worldview: "世界观模式",
  conflict_pattern: "冲突模式",
  narrative_rhythm: "叙事节奏",
  chapter_structure: "章节结构",
  relationship_dynamic: "关系动态",
  conflict_escalation: "冲突升级",
  cheat_evolution: "金手指演化",
  cool_point_pattern: "爽点模式",
  writing_technique: "写作技巧",
  golden_opening_report: "黄金三章报告",
  // 也支持通用类型
  character: "角色",
  location: "地点",
  faction: "势力",
  item: "道具",
  skill: "技能",
  plotline: "剧情线",
  golden_finger: "金手指",
  foreshadowing: "伏笔",
};

/**
 * 获取模式类型标签
 */
export function getPatternTypeLabel(type: string): string {
  return patternTypeLabels[type] || type;
}
