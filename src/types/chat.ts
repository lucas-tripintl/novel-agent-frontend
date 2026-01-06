/**
 * Chat API 类型定义
 * 对应后端 /api/v1/projects/{project_id}/chat 接口
 */

// ============ 会话相关 ============

export type ChatSessionStatus = "active" | "archived" | "deleted";

export interface ChatSession {
  id: string;
  project_id: string;
  title: string | null;
  status: ChatSessionStatus;
  model_id: string;
  temperature: number;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionDetail extends ChatSession {
  recent_messages?: ChatMessageRead[];
}

export interface ChatSessionCreate {
  model_id?: string;
  temperature?: number;
  title?: string;
}

export interface ChatSessionUpdate {
  model_id?: string;
  temperature?: number;
  title?: string;
  status?: ChatSessionStatus;
}

// ============ 消息相关 ============

export type ChatMessageRole =
  | "user"
  | "assistant"
  | "system"
  | "tool_call"
  | "tool_result";

export type ChatMessageStatus =
  | "streaming"
  | "completed"
  | "failed"
  | "cancelled";

export interface ChatMessageRead {
  id: string;
  sequence: number;
  role: ChatMessageRole;
  content: string;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  status: ChatMessageStatus;
  metadata_: Record<string, unknown>;
  created_at: string;
}

/** 发送消息时的单条消息 */
export interface ChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

/** 消息上下文状态 */
export interface ChatMessageState {
  /** 编辑器中选中的文本 */
  selected_text?: string;
  /** 要使用的技能 ID */
  skill_id?: string;
  /** 引用的实体（角色/设定）ID 列表 */
  context_entity_ids?: string[];
  /** 是否为内联编辑请求 */
  inline_edit?: boolean;
  /** 章节标题（用于上下文） */
  chapter_title?: string;
  /** 章节概要（用于上下文） */
  chapter_outline?: string;
}

/** 发送消息请求体 */
export interface SendChatMessageRequest {
  messages: ChatMessageInput[];
  state?: ChatMessageState;
}

// ============ AG-UI SSE 事件 ============

export type AGUIEventType =
  | "RUN_STARTED"
  | "TEXT_MESSAGE_START"
  | "TEXT_MESSAGE_CONTENT"
  | "TEXT_MESSAGE_END"
  | "TOOL_CALL_START"
  | "TOOL_CALL_ARGS"
  | "TOOL_CALL_END"
  | "RUN_FINISHED"
  | "RUN_ERROR";

export interface AGUIEventBase {
  type: AGUIEventType;
}

export interface AGUIRunStarted extends AGUIEventBase {
  type: "RUN_STARTED";
  thread_id: string;
  run_id: string;
}

export interface AGUITextMessageStart extends AGUIEventBase {
  type: "TEXT_MESSAGE_START";
  message_id: string;
}

export interface AGUITextMessageContent extends AGUIEventBase {
  type: "TEXT_MESSAGE_CONTENT";
  message_id: string;
  delta: string;
}

export interface AGUITextMessageEnd extends AGUIEventBase {
  type: "TEXT_MESSAGE_END";
  message_id: string;
}

export interface AGUIToolCallStart extends AGUIEventBase {
  type: "TOOL_CALL_START";
  tool_call_id: string;
  tool_name: string;
}

export interface AGUIToolCallArgs extends AGUIEventBase {
  type: "TOOL_CALL_ARGS";
  tool_call_id: string;
  delta: string;
}

export interface AGUIToolCallEnd extends AGUIEventBase {
  type: "TOOL_CALL_END";
  tool_call_id: string;
  tool_name: string;
}

export interface AGUIRunFinished extends AGUIEventBase {
  type: "RUN_FINISHED";
  thread_id: string;
  run_id: string;
}

export interface AGUIRunError extends AGUIEventBase {
  type: "RUN_ERROR";
  error: {
    code: string;
    message: string;
  };
}

export type AGUIEvent =
  | AGUIRunStarted
  | AGUITextMessageStart
  | AGUITextMessageContent
  | AGUITextMessageEnd
  | AGUIToolCallStart
  | AGUIToolCallArgs
  | AGUIToolCallEnd
  | AGUIRunFinished
  | AGUIRunError;

// ============ 状态相关 ============

export interface ChatGenerationStatus {
  session_id: string;
  is_generating: boolean;
}

// ============ 工具调用状态（前端用） ============

export interface ToolCallState {
  id: string;
  name: string;
  args: string;
  isComplete: boolean;
}

// ============ 文本上下文（前端用） ============

export interface SelectedTextContext {
  /** 是否启用（默认 true，可关闭） */
  enabled: boolean;
  /** 选中的文本（null 表示全章内容） */
  text: string | null;
  /** 行范围 [from, to] */
  lineRange: [number, number] | null;
  /** 字数 */
  charCount: number;
}

// ============ 模型相关 ============

/** 模型信息 */
export interface ModelInfo {
  /** 模型 ID（如 gemini-2.5-flash） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 提供商类型（如 google, openai, anthropic） */
  provider_type: string;
  /** 是否是系统模型 */
  is_system: boolean;
  /** 是否是默认模型 */
  is_default: boolean;
  /** 上下文窗口大小 */
  context_window: number;
  /** 是否支持思考模式 */
  supports_thinking: boolean;
  /** 输入价格（每百万 token） */
  input_price: number;
  /** 输出价格（每百万 token） */
  output_price: number;
  /** 思考价格（每百万 token） */
  thinking_price: number | null;
}
