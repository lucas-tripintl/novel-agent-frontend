/**
 * 角色属性编辑器类型定义
 * 仅适用于 entity_type = "character" 的实体
 */

/** 角色属性的键名联合类型 */
export type CharacterAttributeKey =
  | "role"
  | "appearance"
  | "style"
  | "speech"
  | "values"
  | "power_level"
  | "ending"
  | "first_show_chapter"
  | "faction"
  | "aliases"
  | "events"
  | "personality"
  | "abilities";

/** 属性配置接口 */
export interface CharacterAttributeConfig {
  /** 属性键名 */
  key: CharacterAttributeKey;
  /** 中文标签 */
  label: string;
  /** 属性类型：text 为文本，array 为数组 */
  type: "text" | "array";
  /** 输入框占位符 */
  placeholder?: string;
  /** 属性描述 */
  description?: string;
  /** 图标名称 */
  icon?: string;
}

/** 属性编辑器主组件 Props */
export interface CharacterAttributesEditorProps {
  /** 当前属性值 */
  attributes: Record<string, unknown>;
  /** 属性变化回调 */
  onChange: (attributes: Record<string, unknown>) => void;
  /** 只读模式 */
  readOnly?: boolean;
  /** 布局紧凑模式（用于对话框） */
  compact?: boolean;
}

/** 单个属性项组件 Props */
export interface AttributeItemProps {
  /** 属性键名 */
  attrKey: string;
  /** 属性值 */
  value: unknown;
  /** 属性配置 */
  config?: CharacterAttributeConfig;
  /** 更新属性回调 */
  onUpdate: (key: string, value: unknown) => void;
  /** 删除属性回调 */
  onDelete: (key: string) => void;
  /** 只读模式 */
  readOnly?: boolean;
}

/** 添加属性弹出层 Props */
export interface AddAttributePopoverProps {
  /** 已存在的属性键名列表 */
  existingKeys: string[];
  /** 添加属性回调 */
  onAdd: (key: CharacterAttributeKey) => void;
}
