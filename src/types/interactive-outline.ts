/**
 * 交互式细纲生成类型定义
 */

// ============ 枚举和基础类型 ============

/** 生成模式 */
export type OutlineGenerationMode = "interactive" | "semi_auto" | "auto_review";

/** 决策密度 */
export type OutlineDensity = "simple" | "detailed";

/** 生成状态 */
export type OutlineGenerationStatus =
  | "idle"        // 空闲
  | "generating"  // 生成中
  | "decision"    // 等待决策
  | "completed"   // 完成
  | "error";      // 错误

/** 决策重要性 */
export type DecisionImportance = "critical" | "normal" | "minor";

// ============ 决策点相关 ============

/** 决策点选项 */
export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  recommended: boolean;
  reason: string;
  impact: string;
}

/** 决策点 */
export interface DecisionPoint {
  id: string;
  type: string;  // OPENING_STYLE, CONFLICT_TYPE, CHARACTER_DECISION, etc.
  question: string;
  context: string;
  options: DecisionOption[];
  importance: DecisionImportance;
  allow_custom: boolean;
}

/** 用户决策 */
export interface UserDecision {
  decision_point_id: string;
  chosen_option_id: string | null;
  custom_input: string | null;
  skipped: boolean;
}

// ============ 请求类型 ============

/** 开始生成请求 */
export interface StartOutlineGenerationRequest {
  mode: OutlineGenerationMode;
  density: OutlineDensity;
  target_type?: string;
  chapter_number: number;
  chapter_title?: string;
  guidance?: string;
  selected_entities?: string[];
  selected_skills?: string[];
  force_new?: boolean;
}

/** 提交决策请求 */
export interface SubmitDecisionRequest {
  draft_id: string;
  decision: UserDecision;
}

// ============ 草稿相关 ============

/** 草稿进度 */
export interface OutlineDraftProgress {
  total_decisions: number;
  completed_decisions: number;
}

/** 草稿信息 */
export interface OutlineDraft {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  segments: unknown[];
  current_decision: DecisionPoint | null;
  decisions_made: Record<string, UserDecision>;
  progress: OutlineDraftProgress;
}

/** 获取草稿响应 */
export interface GetOutlineDraftResponse {
  has_draft: boolean;
  draft?: OutlineDraft;
}

// ============ SSE 事件 ============

/** SSE 事件类型 */
export type OutlineSSEEventType =
  | "RUN_STARTED"
  | "STATE_DELTA"
  | "STATE_SNAPSHOT"
  | "RUN_FINISHED"
  | "RUN_ERROR";

/** STATE_DELTA 操作 */
export interface StateDeltaOp {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

/** RUN_FINISHED 中断信息 */
export interface InterruptInfo {
  id: string;
  reason: string;
  payload: DecisionPoint;
}

/** SSE 事件 */
export interface OutlineSSEEvent {
  type: OutlineSSEEventType;
  // RUN_STARTED
  threadId?: string;
  runId?: string;
  // STATE_DELTA
  delta?: StateDeltaOp[];
  // RUN_FINISHED
  outcome?: "success" | "interrupt";
  interrupt?: InterruptInfo;
  // STATE_SNAPSHOT
  state?: {
    outline: unknown[];
    decisions: Record<string, unknown>;
  };
  // RUN_ERROR
  message?: string;
}

// ============ 生成模式配置 ============

/** 生成模式配置 */
export interface OutlineModeConfig {
  id: OutlineGenerationMode;
  name: string;
  description: string;
}

/** 决策密度配置 */
export interface OutlineDensityConfig {
  id: OutlineDensity;
  name: string;
  description: string;
}

/** 预定义的生成模式 */
export const outlineGenerationModes: OutlineModeConfig[] = [
  {
    id: "interactive",
    name: "交互式",
    description: "每个决策点都暂停，让你参与选择",
  },
  {
    id: "semi_auto",
    name: "半自动",
    description: "只在关键决策点暂停，次要决策自动处理",
  },
  {
    id: "auto_review",
    name: "全自动",
    description: "全部使用 AI 推荐值，最后统一审核",
  },
];

/** 预定义的决策密度 */
export const outlineDensityOptions: OutlineDensityConfig[] = [
  {
    id: "simple",
    name: "简单",
    description: "1-2 个决策点，快速完成",
  },
  {
    id: "detailed",
    name: "详细",
    description: "3-5 个决策点，精细控制",
  },
];
