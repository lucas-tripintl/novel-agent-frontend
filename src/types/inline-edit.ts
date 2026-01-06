/**
 * 内联编辑类型定义
 *
 * 用于 AI 辅助编辑功能，支持选中文本后通过 AI 进行润色、扩写、改写等操作
 */

/** 内联编辑状态 */
export type InlineEditStatus =
  | "idle" // 空闲
  | "prompting" // 等待用户输入指令
  | "streaming" // AI 正在生成
  | "previewing"; // 预览 diff

/** 编辑目标类型 */
export type EditTargetType =
  | "content" // 章节正文
  | "title" // 章节标题
  | "outline" // 章节概要
  | "entity" // 设定内容
  | "novel-outline"; // 总纲/卷纲

/** 快捷操作定义 */
export interface QuickAction {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  label: string;
  /** 发送给 AI 的指令 */
  instruction: string;
  /** 可选图标名（lucide-react） */
  icon?: string;
  /** 可选：关联的技能 ID */
  skillId?: string;
}

/** 默认快捷操作列表 */
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "polish",
    label: "润色",
    instruction: "润色这段文字，使表达更流畅优美，保持原意不变",
    icon: "Sparkles",
  },
  {
    id: "expand",
    label: "扩写",
    instruction: "扩写这段文字，增加更多细节描写，丰富内容",
    icon: "Expand",
  },
  {
    id: "rewrite",
    label: "改写",
    instruction: "换一种方式改写这段文字，保持原意但使用不同的表达",
    icon: "RefreshCw",
  },
  {
    id: "simplify",
    label: "简化",
    instruction: "简化这段文字，使其更加简洁精炼，去除冗余",
    icon: "Minimize2",
  },
];

/** 编辑建议 */
export interface EditSuggestion {
  /** 建议 ID（对应工具调用 ID） */
  id: string;
  /** 编辑目标类型 */
  targetType: EditTargetType;
  /** 原文位置范围（Tiptap pos 或字符索引） */
  range: { from: number; to: number } | null;
  /** 原始文本 */
  originalText: string;
  /** 替换文本（流式更新） */
  replacementText: string;
  /** 修改说明 */
  explanation?: string;
  /** 是否流式完成 */
  isComplete: boolean;
}

/** 内联编辑上下文 */
export interface InlineEditContext {
  /** 当前编辑状态 */
  status: InlineEditStatus;
  /** 编辑目标类型 */
  targetType: EditTargetType | null;
  /** 选中的原始文本 */
  originalText: string;
  /** 选中范围 */
  range: { from: number; to: number } | null;
  /** 当前编辑建议 */
  suggestion: EditSuggestion | null;
  /** 错误信息 */
  error: string | null;
}

/** 内联编辑上下文初始值 */
export const initialInlineEditContext: InlineEditContext = {
  status: "idle",
  targetType: null,
  originalText: "",
  range: null,
  suggestion: null,
  error: null,
};

/** 快捷操作配置 */
export interface QuickActionsConfig {
  /** 所有快捷操作（含自定义） */
  actions: QuickAction[];
  /** 工具栏显示的快捷操作 ID 列表 */
  enabledIds: string[];
}

/** 默认快捷操作配置 */
export const defaultQuickActionsConfig: QuickActionsConfig = {
  actions: DEFAULT_QUICK_ACTIONS,
  enabledIds: ["polish", "expand", "rewrite", "simplify"],
};
