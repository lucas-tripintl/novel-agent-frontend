/**
 * 写作面板相关类型定义
 */

import type { EntityType } from "./api";

// ============ 写作模式 ============

/** 写作模式 */
export type WritingMode = "auto" | "director";

/** 写作模式配置 */
export interface WritingModeConfig {
  id: WritingMode;
  name: string;
  description: string;
  icon: string;
}

export const writingModes: WritingModeConfig[] = [
  {
    id: "auto",
    name: "全自动模式",
    description: "AI 自动选择相关设定，全程自主创作",
    icon: "Sparkles",
  },
  {
    id: "director",
    name: "导演模式",
    description: "手动选择要引用的设定，精细控制创作方向",
    icon: "Film",
  },
];

// ============ 选中的实体 ============

/** 选中的实体（简化版，用于上下文展示） */
export interface SelectedEntity {
  id: string;
  projectId: string;
  name: string;
  entityType: EntityType;
  content?: string;
  tags?: string[];
}

// ============ AI 对话消息 ============

/** 消息角色 */
export type MessageRole = "user" | "assistant" | "system";

/** 消息类型 */
export type MessageType = "text" | "context" | "suggestion" | "error";

/** 对话消息 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: Date;
  /** 流式消息是否完成 */
  isComplete?: boolean;
  /** 关联的设定（AI 自动选择时返回） */
  relatedEntities?: SelectedEntity[];
}

// ============ 流式写作请求/响应 ============

/** 流式写作请求参数 */
export interface StreamWriteParams {
  projectId: string;
  chapterId: string;
  mode: WritingMode;
  /** 导演模式下选择的实体 ID */
  entityIds?: string[];
  /** 用户额外指令 */
  prompt?: string;
  /** 从第几个字符续写 */
  continueFrom?: number;
  /** 章节概要 */
  outline?: string;
}

/** 流式响应数据类型 */
export type StreamEventType =
  | "context"
  | "content"
  | "done"
  | "error"
  | "thinking";

/** 流式响应事件 */
export interface StreamEvent {
  type: StreamEventType;
  /** 内容片段 (content 类型) */
  text?: string;
  /** AI 自动选择的实体 (context 类型) */
  autoSelectedEntities?: SelectedEntity[];
  /** 总字符数 (done 类型) */
  totalChars?: number;
  /** 错误消息 (error 类型) */
  message?: string;
  /** 思考过程 (thinking 类型) */
  thinking?: string;
}

// ============ AI 审稿 ============

/** 审稿维度 */
export type ReviewAspect = "plot" | "character" | "style" | "logic";

/** 审稿请求参数 */
export interface ReviewParams {
  projectId: string;
  chapterId: string;
  content: string;
  aspects: ReviewAspect[];
}

/** 审稿结果 */
export interface ReviewResult {
  aspect: ReviewAspect;
  score: number;
  comment: string;
}

/** 修改建议 */
export interface ReviewSuggestion {
  /** 原文位置范围 [start, end] */
  range: [number, number];
  original: string;
  suggested: string;
  reason: string;
}

// ============ 章节数据 ============

/** 章节草稿 */
export interface ChapterDraft {
  id: string;
  projectId: string;
  chapterNumber: number;
  title: string;
  outline: string;
  content: string;
  /** 是否有未保存的更改 */
  isDirty: boolean;
  /** 最后保存时间 */
  lastSavedAt?: Date;
  /** 字数统计 */
  wordCount: number;
}

/** 保存章节请求 */
export interface SaveChapterParams {
  projectId: string;
  chapterId: string;
  title: string;
  outline?: string;
  content: string;
}

// ============ 编辑器状态 ============

/** 编辑器选区 */
export interface EditorSelection {
  from: number;
  to: number;
  text: string;
}

/** 编辑器状态 */
export interface EditorState {
  /** 是否聚焦 */
  isFocused: boolean;
  /** 当前选区 */
  selection: EditorSelection | null;
  /** 是否只读（AI 写入中） */
  isReadOnly: boolean;
  /** 字数 */
  wordCount: number;
  /** 字符数 */
  charCount: number;
}

// ============ 编辑器设置 ============

/** 字体系列选项 */
export type EditorFontFamily =
  | "system"
  | "serif"
  | "sans"
  | "mono"
  // 开源可商用字体
  | "source-han-sans"
  | "source-han-serif"
  | "lxgw-wenkai"
  // 系统内置
  | "kai"
  | "song"
  | "fangsong";

/** 字体系列配置 */
export interface FontFamilyConfig {
  id: EditorFontFamily;
  name: string;
  fontClass: string;
  preview: string;
  /** 字体分组 */
  group: "basic" | "opensource" | "system";
}

/** 可用字体列表 - 按分组排序 */
export const fontFamilies: FontFamilyConfig[] = [
  // 基础字体
  {
    id: "system",
    name: "系统默认",
    fontClass: "font-sans",
    preview: "系统默认字体",
    group: "basic",
  },
  {
    id: "serif",
    name: "衬线体",
    fontClass: "font-serif",
    preview: "优雅的衬线字体",
    group: "basic",
  },
  {
    id: "sans",
    name: "无衬线",
    fontClass: "font-sans",
    preview: "简洁的无衬线",
    group: "basic",
  },
  {
    id: "mono",
    name: "等宽体",
    fontClass: "font-mono",
    preview: "编程等宽字体",
    group: "basic",
  },
  // 开源可商用字体 (需用户系统安装或 Web Font)
  {
    id: "source-han-sans",
    name: "思源黑体",
    fontClass: "font-source-han-sans",
    preview: "Adobe & Google 开源黑体",
    group: "opensource",
  },
  {
    id: "source-han-serif",
    name: "思源宋体",
    fontClass: "font-source-han-serif",
    preview: "Adobe & Google 开源宋体",
    group: "opensource",
  },
  {
    id: "lxgw-wenkai",
    name: "霞鹜文楷",
    fontClass: "font-lxgw-wenkai",
    preview: "开源楷体，适合正文阅读",
    group: "opensource",
  },
  // 系统内置字体
  {
    id: "kai",
    name: "楷体",
    fontClass: "font-kai",
    preview: "系统楷体",
    group: "system",
  },
  {
    id: "song",
    name: "宋体",
    fontClass: "font-song",
    preview: "系统宋体",
    group: "system",
  },
  {
    id: "fangsong",
    name: "仿宋",
    fontClass: "font-fangsong",
    preview: "系统仿宋体",
    group: "system",
  },
];

/** 字体分组名称 */
export const fontGroupNames: Record<FontFamilyConfig["group"], string> = {
  basic: "基础字体",
  opensource: "开源字体",
  system: "系统字体",
};

/** 编辑器设置 */
export interface EditorSettings {
  /** 字体系列 */
  fontFamily: EditorFontFamily;
  /** 字体大小 (px) */
  fontSize: number;
  /** 行高 (倍数) */
  lineHeight: number;
  /** 段落间距 (px) */
  paragraphSpacing: number;
}
