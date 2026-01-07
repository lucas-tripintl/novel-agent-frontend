import type { CharacterAttributeConfig, CharacterAttributeKey } from "./types";

/**
 * 角色属性配置列表
 * 按逻辑分组排列：基础信息 → 外在表现 → 能力设定 → 关键事件
 */
export const CHARACTER_ATTRIBUTE_CONFIGS: CharacterAttributeConfig[] = [
  // 基础信息
  {
    key: "role",
    label: "角色定位",
    type: "text",
    placeholder: "如：主角、反派、导师、龙套...",
    description: "角色在故事中的定位",
  },
  {
    key: "aliases",
    label: "别名/称号",
    type: "array",
    placeholder: "添加别名或称号...",
    description: "角色的别名、绰号、称号等",
  },
  {
    key: "faction",
    label: "所属阵营",
    type: "text",
    placeholder: "如：萧家、云岚宗...",
    description: "角色所属的势力或阵营",
  },

  // 外在表现
  {
    key: "appearance",
    label: "外貌描述",
    type: "text",
    placeholder: "描述角色的外貌特征...",
    description: "角色的外在形象特征",
  },
  {
    key: "style",
    label: "穿着/出行风格",
    type: "text",
    placeholder: "描述角色的穿着打扮、出行方式...",
    description: "服饰、座驾、排场等",
  },
  {
    key: "speech",
    label: "说话风格",
    type: "text",
    placeholder: "描述角色的语言习惯...",
    description: "语气、口头禅、措辞特点",
  },
  {
    key: "values",
    label: "价值观",
    type: "text",
    placeholder: "描述角色的核心价值观...",
    description: "角色的行事准则和信念",
  },
  {
    key: "personality",
    label: "性格特点",
    type: "array",
    placeholder: "添加性格特点...",
    description: "角色的性格标签",
  },

  // 能力设定
  {
    key: "power_level",
    label: "实力等级",
    type: "text",
    placeholder: "如：天阶初期、金丹期...",
    description: "角色的力量等级（按故事末尾状态）",
  },
  {
    key: "abilities",
    label: "能力",
    type: "array",
    placeholder: "添加能力...",
    description: "角色拥有的技能或能力",
  },

  // 关键事件
  {
    key: "first_show_chapter",
    label: "首次出场",
    type: "text",
    placeholder: "如：第3章",
    description: "角色首次登场的章节",
  },
  {
    key: "events",
    label: "重要事件",
    type: "array",
    placeholder: "添加重要事件...",
    description: "角色经历的重要事件（按时间顺序）",
  },
  {
    key: "ending",
    label: "结局",
    type: "text",
    placeholder: "描述角色最终的命运...",
    description: "角色的结局或走向",
  },
];

/** 属性配置映射 (key -> config) */
export const CHARACTER_ATTRIBUTE_MAP = new Map<
  CharacterAttributeKey,
  CharacterAttributeConfig
>(CHARACTER_ATTRIBUTE_CONFIGS.map((config) => [config.key, config]));

/**
 * 根据键名获取属性配置
 */
export function getConfigByKey(
  key: string
): CharacterAttributeConfig | undefined {
  return CHARACTER_ATTRIBUTE_MAP.get(key as CharacterAttributeKey);
}

/**
 * 获取可添加的属性配置列表（排除已存在的属性）
 */
export function getAvailableConfigs(
  existingKeys: string[]
): CharacterAttributeConfig[] {
  const existingSet = new Set(existingKeys);
  return CHARACTER_ATTRIBUTE_CONFIGS.filter(
    (config) => !existingSet.has(config.key)
  );
}

/**
 * 获取属性标签（中文）
 * 如果找不到配置，返回格式化后的键名
 */
export function getAttributeLabel(key: string): string {
  const config = getConfigByKey(key);
  if (config) return config.label;

  // fallback: 格式化键名
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * 判断属性是否为数组类型
 */
export function isArrayAttribute(key: string): boolean {
  const config = getConfigByKey(key);
  return config?.type === "array";
}

/**
 * 获取属性的初始值
 */
export function getInitialValue(key: string): string | string[] {
  const config = getConfigByKey(key);
  return config?.type === "array" ? [] : "";
}
