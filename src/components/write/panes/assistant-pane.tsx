"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  useWritingMode,
  useContextEntities,
  useChatSessionState,
  useSelectedSkill,
  useSelectedModel,
  useEditorContent,
  useWritingStore,
  useActiveContextSource,
  useEntityEditing,
  useOutlineEditing,
  useChapterOutlineState,
} from "@/stores/writing-store";
import {
  useChatSessions,
  useChatMessages,
  useCreateChatSession,
  useSendChatMessage,
} from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bot,
  Sparkles,
  Film,
  Send,
  Loader2,
  StopCircle,
  Plus,
} from "lucide-react";
import { SelectedContext } from "../assistant/selected-context";
import { ChatMessage } from "../assistant/chat-message";
import {
  TextContextChip,
  EnableTextContextButton,
} from "../assistant/text-context-chip";
import { SkillSelector } from "../assistant/skill-selector";
import { ToolCallIndicator } from "../assistant/tool-call-indicator";
import { SessionHistory } from "../assistant/session-history";
import { ModelSelector } from "../assistant/model-selector";
import type { ChatMessage as ChatMessageType } from "@/types/writing";
import type { SendChatMessageRequest } from "@/types/chat";

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface AssistantPaneProps {
  projectId: string;
}

export function AssistantPane({ projectId }: AssistantPaneProps) {
  const [inputValue, setInputValue] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mode = useWritingMode();
  const contextEntities = useContextEntities();
  const { content: editorContent, outline } = useEditorContent();
  const { chapterOutline } = useChapterOutlineState();
  const { activeContextSource } = useActiveContextSource();
  const { editingEntity } = useEntityEditing();
  const { editingOutline } = useOutlineEditing();
  const { selectedSkillId } = useSelectedSkill();
  const { selectedModelId } = useSelectedModel();
  const {
    currentSessionId,
    streamingContent,
    activeToolCalls,
    setCurrentChatSession,
    setStreamingChatContent,
    setActiveToolCalls,
  } = useChatSessionState();

  // 获取会话列表（用于自动创建会话）
  const { data: sessionsData } = useChatSessions(projectId, { status: "active" });
  const sessions = useMemo(
    () => sessionsData?.items ?? [],
    [sessionsData?.items]
  );

  // 创建会话
  const createSession = useCreateChatSession(projectId);

  // 获取消息历史
  const { data: messagesData } = useChatMessages(
    projectId,
    currentSessionId ?? "",
    { enabled: !!currentSessionId }
  );

  // 服务器消息（按 sequence 排序）
  const serverMessages: ChatMessageType[] = (messagesData?.pages ?? [])
    .flatMap((page) => page.items)
    .sort((a, b) => a.sequence - b.sequence)
    .map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      type: msg.status === "failed" ? "error" : "text",
      content: msg.content,
      timestamp: new Date(msg.created_at),
      isComplete: msg.status === "completed",
    }));

  // 发送消息
  const {
    sendMessage,
    cancel: cancelMessage,
    isStreaming,
    toolCalls,
  } = useSendChatMessage(projectId, currentSessionId ?? "", {
    onTextContent: (_delta, fullText) => {
      setStreamingChatContent(fullText);
    },
    onToolCallStart: (tc) => {
      // 使用 getState() 获取最新状态，避免闭包陷阱
      const current = useWritingStore.getState().activeToolCalls;
      setActiveToolCalls([...current, tc]);
    },
    onToolCallEnd: (id) => {
      // 使用 getState() 获取最新状态，避免闭包陷阱
      const current = useWritingStore.getState().activeToolCalls;
      setActiveToolCalls(
        current.map((tc) =>
          tc.id === id ? { ...tc, isComplete: true } : tc
        )
      );
    },
    onTextEnd: () => {
      setStreamingChatContent("");
      setActiveToolCalls([]);
    },
    onFinish: () => {
      setStreamingChatContent("");
      setActiveToolCalls([]);
      // 注意：不在这里清空 localMessages
      // React Query 会通过 invalidateQueries 刷新 serverMessages
      // 刷新完成后 serverMessages 会包含最新消息
    },
    onError: (error) => {
      console.error("消息发送失败:", error);
      // 添加错误消息到本地
      setLocalMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          type: "error",
          content: error.message,
          timestamp: new Date(),
          isComplete: true,
        },
      ]);
      setStreamingChatContent("");
      setActiveToolCalls([]);
    },
  });

  // 合并消息逻辑：
  // - 基础：显示服务器历史消息
  // - 流式期间：追加本地用户消息 + 流式 AI 回复
  // - 流式结束：React Query 刷新后，服务器消息会包含最新内容
  const displayMessages = useMemo(() => {
    // 基础消息：服务器历史
    const messages = [...serverMessages];

    // 追加本地消息（过滤掉已存在于服务器的消息）
    // 使用消息内容+角色来匹配，因为本地 id 和服务器 id 不同
    if (localMessages.length > 0) {
      const serverMsgContents = new Set(
        serverMessages.map((m) => `${m.role}:${m.content}`)
      );
      const newLocalMsgs = localMessages.filter(
        (m) => !serverMsgContents.has(`${m.role}:${m.content}`)
      );
      messages.push(...newLocalMsgs);
    }

    // 流式 AI 回复
    if (streamingContent) {
      messages.push({
        id: "streaming",
        role: "assistant" as const,
        type: "text" as const,
        content: streamingContent,
        timestamp: new Date(),
        isComplete: false,
      });
    }

    return messages;
  }, [serverMessages, localMessages, streamingContent]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length, streamingContent]);

  // 每次进入项目时自动创建新会话（不再复用旧会话）
  // 使用本地状态跟踪初始化，避免依赖 createSession 对象导致的竞态条件
  const [isInitializing, setIsInitializing] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // 只在首次进入且没有当前会话时创建新会话
    if (!hasInitializedRef.current && !currentSessionId && !isInitializing) {
      hasInitializedRef.current = true;
      setIsInitializing(true);

      createSession.mutateAsync({ model_id: selectedModelId ?? undefined })
        .then((newSession) => {
          setCurrentChatSession(newSession.id);
        })
        .catch((error) => {
          console.error("自动创建会话失败:", error);
          // 重置标志以允许重试
          hasInitializedRef.current = false;
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [currentSessionId, isInitializing, selectedModelId, setCurrentChatSession, createSession]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;

    let sessionId = currentSessionId;

    // 如果没有会话，先创建一个
    if (!sessionId) {
      try {
        const newSession = await createSession.mutateAsync({
          model_id: selectedModelId ?? undefined,
        });
        sessionId = newSession.id;
        setCurrentChatSession(sessionId);
      } catch (error) {
        console.error("创建会话失败:", error);
        return;
      }
    }

    // 添加用户消息到本地（清空之前的本地消息，只保留当前新消息）
    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      type: "text",
      content: inputValue.trim(),
      timestamp: new Date(),
      isComplete: true,
    };
    setLocalMessages([userMessage]);
    setInputValue("");

    // 根据 activeContextSource.type 获取实际内容
    const getContextContent = (): string | undefined => {
      if (!activeContextSource?.enabled) return undefined;

      switch (activeContextSource.type) {
        case "editor-content":
          return editorContent;
        case "editor-outline":
          return chapterOutline;
        case "editor-summary":
          return outline;
        case "entity-detail":
          // 设定详情
          return editingEntity
            ? `【${editingEntity.name}】\n${editingEntity.content}`
            : undefined;
        case "outline-detail":
          // 大纲详情
          return editingOutline?.data.content ?? undefined;
        default:
          return undefined;
      }
    };

    // 组装请求
    const request: SendChatMessageRequest = {
      messages: [{ role: "user", content: userMessage.content }],
      state: {
        // 设定引用
        context_entity_ids:
          contextEntities.length > 0
            ? contextEntities.map((e) => e.id)
            : undefined,
        // 根据上下文类型获取内容
        selected_text: getContextContent(),
        // 技能
        skill_id: selectedSkillId ?? undefined,
      },
    };

    // 发送消息（传入 sessionId 以确保使用新创建的会话）
    await sendMessage(request, sessionId);
  }, [
    inputValue,
    isStreaming,
    currentSessionId,
    contextEntities,
    activeContextSource,
    editorContent,
    chapterOutline,
    outline,
    editingEntity,
    editingOutline,
    selectedSkillId,
    selectedModelId,
    createSession,
    setCurrentChatSession,
    sendMessage,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 跟踪手动创建新会话的状态
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // 按钮是否应该禁用（正在初始化、正在手动创建会话、或正在流式输出）
  // 注意：不使用 createSession.isPending，因为它在某些情况下不会正确重置
  const isSessionBusy = isInitializing || isCreatingSession || isStreaming;

  // 创建新对话
  const handleCreateNewSession = useCallback(async () => {
    if (isCreatingSession || isStreaming) return;
    setIsCreatingSession(true);
    try {
      const newSession = await createSession.mutateAsync({
        model_id: selectedModelId ?? undefined,
      });
      setCurrentChatSession(newSession.id);
      setLocalMessages([]);
    } catch (error) {
      console.error("创建新对话失败:", error);
    } finally {
      setIsCreatingSession(false);
    }
  }, [createSession, isCreatingSession, isStreaming, selectedModelId, setCurrentChatSession]);

  return (
    <div className="flex h-full flex-col border-l border-border/50 bg-card/30 min-h-0">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">AI 助手</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] gap-1",
              mode === "auto" ? "text-primary" : "text-amber-500"
            )}
          >
            {mode === "auto" ? (
              <>
                <Sparkles className="h-2.5 w-2.5" />
                全自动
              </>
            ) : (
              <>
                <Film className="h-2.5 w-2.5" />
                导演
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector projectId={projectId} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="新建对话"
            onClick={handleCreateNewSession}
            disabled={isSessionBusy}
          >
            {isSessionBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          <SessionHistory projectId={projectId} />
        </div>
      </div>

      {/* 上下文区域 */}
      <SelectedContext entities={contextEntities} mode={mode} />

      {/* 附加上下文（文本 + 技能） */}
      <div className="px-4 py-2 border-b border-border/50 flex flex-wrap gap-2">
        <TextContextChip />
        <EnableTextContextButton />
        <SkillSelector />
      </div>

      {/* 工具调用指示器 */}
      <ToolCallIndicator toolCalls={toolCalls} />

      {/* 对话区域 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">开始与 AI 对话</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                询问创作建议、讨论情节发展，或让 AI 帮你续写内容
              </p>
            </div>
          ) : (
            displayMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="p-3 border-t border-border/50">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={isStreaming}
            className={cn(
              "min-h-[60px] max-h-[120px] resize-none pr-12",
              "focus-visible:ring-1 focus-visible:ring-primary/30"
            )}
          />
          {isStreaming ? (
            <Button
              size="icon"
              variant="destructive"
              className="absolute right-2 bottom-2 h-8 w-8"
              onClick={cancelMessage}
              title="停止生成"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className={cn(
                "absolute right-2 bottom-2 h-8 w-8",
                !inputValue.trim() && "opacity-50"
              )}
              onClick={handleSend}
              disabled={!inputValue.trim() || isInitializing}
            >
              {isInitializing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
