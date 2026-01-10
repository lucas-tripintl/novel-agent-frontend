/**
 * Chat 相关 hooks
 * 封装 Chat API 的 React Query 调用和流式消息处理
 */

import { useState, useCallback, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import type { AgentSubscriber } from "@ag-ui/client";
import { PAGE_SIZES } from "@/components/common/pagination";
import {
  createChatSession,
  listChatSessions,
  getChatSession,
  updateChatSession,
  deleteChatSession,
  listChatMessages,
  sendChatMessage,
  cancelChatGeneration,
  getChatGenerationStatus,
  listModels,
} from "@/lib/api/chat";
import type {
  ChatSessionCreate,
  ChatSessionUpdate,
  SendChatMessageRequest,
  ChatSessionStatus,
  ToolCallState,
} from "@/types/chat";

// ============ Query Keys ============

export const chatKeys = {
  all: ["chat"] as const,
  sessions: (projectId: string) =>
    [...chatKeys.all, "sessions", projectId] as const,
  sessionList: (projectId: string, params?: { status?: ChatSessionStatus }) =>
    [...chatKeys.sessions(projectId), "list", params] as const,
  session: (projectId: string, sessionId: string) =>
    [...chatKeys.sessions(projectId), "detail", sessionId] as const,
  messages: (projectId: string, sessionId: string) =>
    [...chatKeys.session(projectId, sessionId), "messages"] as const,
  status: (projectId: string, sessionId: string) =>
    [...chatKeys.session(projectId, sessionId), "status"] as const,
  models: () => [...chatKeys.all, "models"] as const,
};

// ============ 常量 ============

const SESSIONS_PAGE_SIZE = PAGE_SIZES.MEDIUM;
const MESSAGES_PAGE_SIZE = PAGE_SIZES.EXTRA_LARGE;

// ============ 会话 Hooks ============

/** 获取会话列表 */
export function useChatSessions(
  projectId: string,
  params?: { status?: ChatSessionStatus },
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: chatKeys.sessionList(projectId, params),
    queryFn: () =>
      listChatSessions(projectId, { ...params, limit: SESSIONS_PAGE_SIZE }),
    enabled: enabled && !!projectId,
  });
}

/** 获取单个会话详情 */
export function useChatSession(
  projectId: string,
  sessionId: string,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: chatKeys.session(projectId, sessionId),
    queryFn: () => getChatSession(projectId, sessionId),
    enabled: enabled && !!projectId && !!sessionId,
  });
}

/** 创建会话 */
export function useCreateChatSession(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: ChatSessionCreate) =>
      createChatSession(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(projectId) });
    },
  });
}

/** 更新会话 */
export function useUpdateChatSession(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: ChatSessionUpdate;
    }) => updateChatSession(projectId, sessionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(projectId) });
      queryClient.invalidateQueries({
        queryKey: chatKeys.session(projectId, variables.sessionId),
      });
    },
  });
}

/** 删除会话 */
export function useDeleteChatSession(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => deleteChatSession(projectId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(projectId) });
    },
  });
}

// ============ 消息 Hooks ============

/** 获取消息历史（无限滚动） */
export function useChatMessages(
  projectId: string,
  sessionId: string,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useInfiniteQuery({
    queryKey: chatKeys.messages(projectId, sessionId),
    queryFn: ({ pageParam = 0 }) =>
      listChatMessages(projectId, sessionId, {
        skip: pageParam,
        limit: MESSAGES_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.items.length,
        0
      );
      if (loadedCount >= lastPage.total) {
        return undefined;
      }
      return loadedCount;
    },
    enabled: enabled && !!projectId && !!sessionId,
  });
}

// ============ 流式消息 Hook ============

export interface UseSendChatMessageOptions {
  /** 运行开始 */
  onStart?: () => void;
  /** 文本消息开始 */
  onTextStart?: (messageId: string) => void;
  /** 文本内容增量 */
  onTextContent?: (delta: string, fullText: string) => void;
  /** 文本消息结束 */
  onTextEnd?: (messageId: string, fullText: string) => void;
  /** 工具调用开始 */
  onToolCallStart?: (toolCall: ToolCallState) => void;
  /** 工具调用参数（流式增量） */
  onToolCallArgs?: (toolCallId: string, argsBuffer: string, partialArgs: Record<string, unknown>) => void;
  /** 工具调用结束 */
  onToolCallEnd?: (toolCallId: string, toolName: string, args: Record<string, unknown>) => void;
  /** 运行结束 */
  onFinish?: () => void;
  /** 运行出错 */
  onError?: (error: Error) => void;
}

export function useSendChatMessage(
  projectId: string,
  sessionId: string,
  options: UseSendChatMessageOptions = {}
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentText, setCurrentText] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCallState[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textBufferRef = useRef("");
  const toolCallsMapRef = useRef<Map<string, ToolCallState>>(new Map());
  const queryClient = useQueryClient();

  // 使用 ref 存储最新的 options，避免闭包陷阱
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sendMessage = useCallback(
    async (request: SendChatMessageRequest, overrideSessionId?: string) => {
      const effectiveSessionId = overrideSessionId ?? sessionId;
      if (!effectiveSessionId) {
        const err = new Error("会话 ID 不能为空");
        setError(err);
        optionsRef.current.onError?.(err);
        return;
      }

      setError(null);
      setCurrentText("");
      setToolCalls([]);
      setIsStreaming(true);
      textBufferRef.current = "";
      toolCallsMapRef.current.clear();

      abortControllerRef.current = new AbortController();

      // 使用 optionsRef.current 获取最新回调，避免闭包陷阱
      const subscriber: AgentSubscriber = {
        onRunInitialized: () => {
          optionsRef.current.onStart?.();
        },

        onTextMessageStartEvent: ({ event }) => {
          optionsRef.current.onTextStart?.(event.messageId);
        },

        onTextMessageContentEvent: ({ event, textMessageBuffer }) => {
          textBufferRef.current = textMessageBuffer;
          setCurrentText(textMessageBuffer);
          optionsRef.current.onTextContent?.(event.delta, textMessageBuffer);
        },

        onTextMessageEndEvent: ({ event, textMessageBuffer }) => {
          optionsRef.current.onTextEnd?.(event.messageId, textMessageBuffer);
        },

        onToolCallStartEvent: ({ event }) => {
          const toolCall: ToolCallState = {
            id: event.toolCallId,
            name: event.toolCallName,
            args: "",
            isComplete: false,
          };
          toolCallsMapRef.current.set(event.toolCallId, toolCall);
          setToolCalls(Array.from(toolCallsMapRef.current.values()));
          optionsRef.current.onToolCallStart?.(toolCall);
        },

        onToolCallArgsEvent: ({ event, toolCallBuffer, partialToolCallArgs }) => {
          const tc = toolCallsMapRef.current.get(event.toolCallId);
          if (tc) {
            tc.args = toolCallBuffer;
            setToolCalls(Array.from(toolCallsMapRef.current.values()));
            // 传递字符串 buffer 和 SDK 部分解析的对象
            optionsRef.current.onToolCallArgs?.(event.toolCallId, toolCallBuffer, partialToolCallArgs);
          }
        },

        onToolCallEndEvent: ({ event, toolCallName, toolCallArgs }) => {
          const tc = toolCallsMapRef.current.get(event.toolCallId);
          if (tc) {
            tc.isComplete = true;
            setToolCalls(Array.from(toolCallsMapRef.current.values()));
            // 传递 SDK 解析后的完整参数对象
            optionsRef.current.onToolCallEnd?.(event.toolCallId, toolCallName, toolCallArgs);
          }
        },

        onRunFinalized: () => {
          setIsStreaming(false);
          optionsRef.current.onFinish?.();

          // 刷新消息列表
          queryClient.invalidateQueries({
            queryKey: chatKeys.messages(projectId, effectiveSessionId),
          });
          // 刷新会话（更新 message_count）
          queryClient.invalidateQueries({
            queryKey: chatKeys.session(projectId, effectiveSessionId),
          });
        },

        onRunFailed: ({ error: runError }) => {
          setIsStreaming(false);
          const err =
            runError instanceof Error
              ? runError
              : new Error(String(runError));
          setError(err);
          optionsRef.current.onError?.(err);
        },

        onRunErrorEvent: ({ event }) => {
          const err = new Error(event.message);
          setError(err);
          optionsRef.current.onError?.(err);
        },
      };

      try {
        await sendChatMessage(
          projectId,
          effectiveSessionId,
          request,
          subscriber,
          abortControllerRef.current
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          console.log("消息发送已取消");
        } else {
          const error = err as Error;
          setError(error);
          optionsRef.current.onError?.(error);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [projectId, sessionId, queryClient]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    // 同时调用后端取消接口
    if (sessionId) {
      cancelChatGeneration(projectId, sessionId).catch(console.error);
    }
  }, [projectId, sessionId]);

  const reset = useCallback(() => {
    setError(null);
    setCurrentText("");
    setToolCalls([]);
    textBufferRef.current = "";
    toolCallsMapRef.current.clear();
  }, []);

  return {
    sendMessage,
    cancel,
    reset,
    isStreaming,
    error,
    currentText,
    toolCalls,
  };
}

// ============ 状态 Hooks ============

/** 获取生成状态 */
export function useChatGenerationStatus(
  projectId: string,
  sessionId: string,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  const { enabled = true, refetchInterval } = options ?? {};

  return useQuery({
    queryKey: chatKeys.status(projectId, sessionId),
    queryFn: () => getChatGenerationStatus(projectId, sessionId),
    enabled: enabled && !!projectId && !!sessionId,
    refetchInterval,
  });
}

/** 取消生成 */
export function useCancelChatGeneration(projectId: string) {
  return useMutation({
    mutationFn: (sessionId: string) =>
      cancelChatGeneration(projectId, sessionId),
  });
}

// ============ 模型 Hooks ============

/** 获取可用模型列表 */
export function useModels(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: chatKeys.models(),
    queryFn: () => listModels(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新获取
  });
}
