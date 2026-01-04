/**
 * 枚举本地化类型定义 - 对应 /api/v1/enums 接口
 */

/** 单个枚举项 */
export interface EnumItem {
  value: string;
  label: string;
  description: string;
}

/** 枚举定义 */
export interface EnumDefinition {
  name: string;
  label: string;
  items: EnumItem[];
}

/** 字段值映射 */
export interface FieldValueDefinition {
  field: string;
  label: string;
  values: Record<string, string>;
}

/** API 响应结构 */
export interface EnumsResponse {
  version: string;
  locale: string;
  enums: Record<string, EnumDefinition>;
  field_values: Record<string, FieldValueDefinition>;
}

/** 已知的枚举名称（用于类型提示） */
export type KnownEnumName =
  | "EntityType"
  | "EntityLevel"
  | "SourceType"
  | "EntityStatus"
  | "ProjectType"
  | "ProjectStatus"
  | "ChapterStatus"
  | "FusionStatus"
  | "FusionMode"
  | "TaskStatus"
  | "IdeaStatus"
  | "TransactionType"
  | "PlanTier"
  | "SubscriptionStatus"
  | "UserRole"
  | "UserStatus"
  | "WorldBuildingFragmentCategory"
  | "CharacterImportance"
  | "CharacterRole"
  | "WorldviewCategory";

/** 已知的字段名称（用于类型提示） */
export type KnownFieldName =
  | "state_change_type"
  | "plotline_action"
  | "golden_finger_event_type"
  | "golden_finger_type"
  | "golden_finger_limitation_type"
  | "importance"
  | "new_character_role"
  | "topic_status"
  | "role_in_chapter";
