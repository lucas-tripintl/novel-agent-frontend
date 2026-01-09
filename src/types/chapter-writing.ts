/**
 * 交互式章节正文生成类型定义
 */

// 复用细纲生成的决策相关类型
export type {
  DecisionOption,
  DecisionPoint,
  DecisionImportance,
  UserDecision,
  InterruptInfo,
} from "./interactive-outline";

// ============ 枚举和基础类型 ============

/** 正文生成模式 */
export type ChapterGenerationMode = "interactive" | "semi_auto" | "auto_review";

/** 决策密度 */
export type ChapterDecisionDensity = "simple" | "detailed";

/** 生成状态 */
export type ContentGenerationStatus =
  | "idle"        // 空闲
  | "generating"  // 生成中
  | "decision"    // 等待决策
  | "completed"   // 完成
  | "error";      // 错误

/** 正文决策类型 */
export type ChapterDecisionType =
  | "character_choice"      // 角色关键抉择
  | "plot_direction"        // 剧情走向
  | "relationship_change"   // 关系转变
  | "foreshadow_reveal"     // 伏笔揭示
  | "conflict_resolution";  // 冲突解决

// ============ 请求类型 ============

/** 开始正文生成请求 */
export interface StartChapterWritingRequest {
  mode: ChapterGenerationMode;
  density: ChapterDecisionDensity;
  chapter_number: number;
  chapter_title?: string;
  writing_guidance?: string;  // 用户创意指导
  selected_entities?: string[];
  selected_skills?: string[];
}

/** 提交正文决策请求 */
export interface SubmitChapterDecisionRequest {
  draft_id: string;
  decision: import("./interactive-outline").UserDecision;
}

/** 确认正文草稿请求 */
export interface ConfirmChapterDraftRequest {
  draft_id: string;
}

// ============ 草稿相关 ============

/** 草稿进度 */
export interface ChapterDraftProgress {
  total_decisions: number;
  completed_decisions: number;
}

/** 草稿信息 */
export interface ChapterWritingDraft {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  content: string;  // 已生成的正文内容
  current_decision: import("./interactive-outline").DecisionPoint | null;
  decisions_made: Record<string, import("./interactive-outline").UserDecision>;
  progress: ChapterDraftProgress;
}

/** 获取草稿响应 */
export interface GetChapterDraftResponse {
  has_draft: boolean;
  draft?: ChapterWritingDraft;
}

/** 确认草稿响应 */
export interface ConfirmChapterDraftResponse {
  success: boolean;
  result?: {
    content: string;
    word_count: number;
  };
}

// ============ AG-UI SDK 扩展类型 ============

/**
 * SSE 状态数据
 */
export interface ChapterSSEStateData {
  content?: string;  // 正文内容
  decisions?: Record<string, unknown>;
}

/**
 * RUN_FINISHED 事件的 result 结构
 */
export interface ChapterRunResult {
  outcome: "success" | "interrupt" | "error";
  content?: string;  // success 时的完整正文
  state?: ChapterSSEStateData;
  interrupt?: import("./interactive-outline").InterruptInfo;
  error?: {
    code: string;
    message: string;
  };
}

// ============ 生成模式配置 ============

/** 生成模式配置 */
export interface ChapterModeConfig {
  id: ChapterGenerationMode;
  name: string;
  description: string;
}

/** 决策密度配置 */
export interface ChapterDensityConfig {
  id: ChapterDecisionDensity;
  name: string;
  description: string;
}

/** 预定义的生成模式 */
export const chapterGenerationModes: ChapterModeConfig[] = [
  {
    id: "interactive",
    name: "交互式",
    description: "每个剧情决策点都暂停，让你参与选择",
  },
  {
    id: "semi_auto",
    name: "半自动",
    description: "只在关键决策点暂停，次要决策自动处理",
  },
  {
    id: "auto_review",
    name: "全自动",
    description: "全部使用 AI 推荐值，生成后统一审核",
  },
];

/** 预定义的决策密度 */
export const chapterDensityOptions: ChapterDensityConfig[] = [
  {
    id: "simple",
    name: "简单",
    description: "只在关键剧情节点决策",
  },
  {
    id: "detailed",
    name: "详细",
    description: "更多决策点，精细控制剧情走向",
  },
];

/** 决策类型配置 */
export const chapterDecisionTypes: Record<ChapterDecisionType, { name: string; icon: string }> = {
  character_choice: { name: "角色抉择", icon: "user" },
  plot_direction: { name: "剧情走向", icon: "git-branch" },
  relationship_change: { name: "关系转变", icon: "heart" },
  foreshadow_reveal: { name: "伏笔揭示", icon: "eye" },
  conflict_resolution: { name: "冲突解决", icon: "swords" },
};
