/**
 * Chat API - AI 对话功能
 * 对应后端 /api/v1/projects/{project_id}/chat 接口
 */

import { apiClient } from "./client";
import { HttpAgent, type AgentSubscriber } from "@ag-ui/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  ChatSession,
  ChatSessionDetail,
  ChatSessionCreate,
  ChatSessionUpdate,
  ChatMessageRead,
  SendChatMessageRequest,
  ChatGenerationStatus,
  ChatSessionStatus,
  ModelInfo,
} from "@/types/chat";

// API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// 生成唯一 ID（兼容非 HTTPS 环境）
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ============ 获取存储的 token ============
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("novel-agent-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
    // ignore
  }
  return null;
}

// ============ 会话 CRUD ============

/** 创建会话 */
export async function createChatSession(
  projectId: string,
  data?: ChatSessionCreate
): Promise<ChatSession> {
  return apiClient.post(`/projects/${projectId}/chat/sessions`, data);
}

/** 获取会话列表 */
export async function listChatSessions(
  projectId: string,
  params?: {
    status?: ChatSessionStatus;
    skip?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<ChatSession>> {
  return apiClient.get(`/projects/${projectId}/chat/sessions`, { params });
}

/** 获取会话详情 */
export async function getChatSession(
  projectId: string,
  sessionId: string
): Promise<ChatSessionDetail> {
  return apiClient.get(`/projects/${projectId}/chat/sessions/${sessionId}`);
}

/** 更新会话配置 */
export async function updateChatSession(
  projectId: string,
  sessionId: string,
  data: ChatSessionUpdate
): Promise<ChatSession> {
  return apiClient.patch(
    `/projects/${projectId}/chat/sessions/${sessionId}`,
    data
  );
}

/** 删除会话 */
export async function deleteChatSession(
  projectId: string,
  sessionId: string
): Promise<{ message: string }> {
  return apiClient.delete(`/projects/${projectId}/chat/sessions/${sessionId}`);
}

// ============ 消息相关 ============

/** 获取消息历史 */
export async function listChatMessages(
  projectId: string,
  sessionId: string,
  params?: {
    skip?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<ChatMessageRead>> {
  return apiClient.get(
    `/projects/${projectId}/chat/sessions/${sessionId}/messages`,
    { params }
  );
}

// ============ 流式消息（使用 @ag-ui/client）============

/**
 * 创建 Chat Agent 实例
 *
 * 使用方式：
 * ```typescript
 * const agent = createChatAgent(projectId, sessionId);
 * await agent.runAgent({}, {
 *   onTextMessageContentEvent: ({ event, textMessageBuffer }) => {
 *     console.log('Content:', event.delta, 'Full:', textMessageBuffer);
 *   },
 *   onToolCallStartEvent: ({ event }) => {
 *     console.log('Tool call:', event.toolCallName);
 *   },
 *   onRunFinishedEvent: () => {
 *     console.log('Done');
 *   },
 *   onRunErrorEvent: ({ event }) => {
 *     console.error('Error:', event.message);
 *   },
 * });
 * ```
 */
export function createChatAgent(
  projectId: string,
  sessionId: string,
  request: SendChatMessageRequest
): HttpAgent {
  const token = getStoredToken();

  const agent = new HttpAgent({
    url: `${API_BASE_URL}/projects/${projectId}/chat/sessions/${sessionId}/message`,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    initialMessages: request.messages.map((msg) => ({
      id: generateId(),
      role: msg.role,
      content: msg.content,
    })),
    initialState: request.state || {},
  });

  return agent;
}

/**
 * 发送聊天消息并处理流式响应
 *
 * 这是一个更简单的封装，直接返回 Promise
 */
export async function sendChatMessage(
  projectId: string,
  sessionId: string,
  request: SendChatMessageRequest,
  subscriber: AgentSubscriber,
  abortController?: AbortController
): Promise<void> {
  const agent = createChatAgent(projectId, sessionId, request);

  try {
    await agent.runAgent(
      {
        abortController,
      },
      subscriber
    );
  } catch (error) {
    // 如果是取消操作，不抛出错误
    if ((error as Error).name === "AbortError") {
      return;
    }
    throw error;
  }
}

// ============ 控制相关 ============

/** 取消生成 */
export async function cancelChatGeneration(
  projectId: string,
  sessionId: string
): Promise<{ message: string }> {
  return apiClient.post(
    `/projects/${projectId}/chat/sessions/${sessionId}/cancel`
  );
}

/** 获取生成状态 */
export async function getChatGenerationStatus(
  projectId: string,
  sessionId: string
): Promise<ChatGenerationStatus> {
  return apiClient.get(
    `/projects/${projectId}/chat/sessions/${sessionId}/status`
  );
}

// ============ 模型相关 ============

/** 获取可用模型列表 */
export async function listModels(): Promise<ModelInfo[]> {
  return apiClient.get("/models");
}
