/**
 * 内联编辑 Hook
 *
 * 封装 AI 辅助编辑的完整流程：
 * 1. 创建临时会话（每次内联编辑独立）
 * 2. 发送编辑请求（携带上下文）
 * 3. 监听 suggest_edit 工具调用
 * 4. 解析流式 JSON 更新预览
 * 5. 管理编辑状态
 */

import { useCallback, useRef, useState } from "react";
import { useSendChatMessage } from "./use-chat";
import { createChatSession } from "@/lib/api/chat";
import {
  useInlineEditState,
  useContextEntities,
  useEditorContent,
  useSelectedSkill,
  useWritingStore,
} from "@/stores/writing-store";
import type { QuickAction, EditTargetType, EditSuggestion } from "@/types/inline-edit";
import type { SendChatMessageRequest } from "@/types/chat";

/** 解析部分 JSON 的辅助函数 */
function parsePartialJSON(str: string): Record<string, unknown> {
  if (!str.trim()) return {};

  // 尝试直接解析
  try {
    return JSON.parse(str);
  } catch {
    // 常见的不完整情况处理
  }

  // 尝试补全缺失的闭合符号
  let fixedStr = str.trim();

  // 移除尾部逗号
  fixedStr = fixedStr.replace(/,\s*$/, "");

  // 尝试补全引号和括号
  const openBraces = (fixedStr.match(/{/g) || []).length;
  const closeBraces = (fixedStr.match(/}/g) || []).length;
  const openQuotes = (fixedStr.match(/"/g) || []).length;

  // 补全引号（如果是奇数）
  if (openQuotes % 2 === 1) {
    fixedStr += '"';
  }

  // 补全括号
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixedStr += "}";
  }

  try {
    return JSON.parse(fixedStr);
  } catch {
    return {};
  }
}

export interface UseInlineEditOptions {
  /** 项目 ID */
  projectId: string;
  /** 编辑预览更新回调 */
  onPreviewUpdate?: (suggestion: Partial<EditSuggestion>) => void;
  /** 编辑完成回调 */
  onEditComplete?: (suggestion: EditSuggestion) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export function useInlineEdit({
  projectId,
  onPreviewUpdate,
  onEditComplete,
  onError,
}: UseInlineEditOptions) {
  const {
    inlineEdit,
    startInlineEdit,
    setInlineEditStatus,
    updateEditSuggestion,
    setEditSuggestion,
    acceptEdit,
    rejectEdit,
    cancelInlineEdit,
    setInlineEditError,
  } = useInlineEditState();

  const contextEntities = useContextEntities();
  const { title, outline } = useEditorContent();
  const { selectedSkillId } = useSelectedSkill();

  // 临时会话 ID（每次内联编辑创建新会话）
  const [tempSessionId, setTempSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // 用于追踪当前工具调用
  const currentToolCallRef = useRef<{
    id: string;
    argsBuffer: string;
  } | null>(null);

  // 流式消息 hook（sessionId 传空字符串，实际发送时用 overrideSessionId）
  const { sendMessage, cancel, isStreaming, error } = useSendChatMessage(
    projectId,
    "",
    {
      onStart: () => {
        setInlineEditStatus("streaming");
      },

      onToolCallStart: (tc) => {
        if (tc.name === "suggest_edit") {
          currentToolCallRef.current = { id: tc.id, argsBuffer: "" };

          // 使用 getState() 获取最新状态，避免闭包陷阱
          const currentInlineEdit = useWritingStore.getState().inlineEdit;

          // 初始化编辑建议
          const initialSuggestion: EditSuggestion = {
            id: tc.id,
            targetType: currentInlineEdit.targetType ?? "content",
            range: currentInlineEdit.range,
            originalText: currentInlineEdit.originalText,
            replacementText: "",
            isComplete: false,
          };
          setEditSuggestion(initialSuggestion);
        }
      },

      onToolCallArgs: (toolCallId, argsBuffer, partialArgs) => {
        if (currentToolCallRef.current?.id === toolCallId) {
          currentToolCallRef.current.argsBuffer = argsBuffer;

          // 优先使用 SDK 解析的部分参数，备用手动解析
          const parsed = (partialArgs && typeof partialArgs === "object" && Object.keys(partialArgs).length > 0)
            ? partialArgs
            : parsePartialJSON(argsBuffer);

          // 兼容 snake_case 和 camelCase 两种格式
          const replacementText = parsed.replacement_text ?? parsed.replacementText;
          const originalText = parsed.original_text ?? parsed.originalText;
          const explanation = parsed.explanation;

          if (replacementText !== undefined) {
            const update: Partial<EditSuggestion> = {
              replacementText: String(replacementText),
            };
            if (originalText !== undefined) {
              update.originalText = String(originalText);
            }
            if (explanation !== undefined) {
              update.explanation = String(explanation);
            }
            updateEditSuggestion(update);
            onPreviewUpdate?.(update);
          }
        }
      },

      onToolCallEnd: (toolCallId, toolName, args) => {
        if (toolName === "suggest_edit" && currentToolCallRef.current?.id === toolCallId) {
          // 使用 getState() 获取最新状态，避免闭包陷阱
          const currentInlineEdit = useWritingStore.getState().inlineEdit;

          // SDK 传递的是解析后的对象，如果没有则使用本地 ref 解析
          const parsed = (args && typeof args === "object")
            ? args as Record<string, unknown>
            : parsePartialJSON(currentToolCallRef.current.argsBuffer);

          // 兼容 snake_case 和 camelCase 两种格式
          const replacementText = parsed.replacement_text ?? parsed.replacementText ?? "";
          const originalText = parsed.original_text ?? parsed.originalText ?? currentInlineEdit.originalText;
          const explanation = parsed.explanation;

          const finalUpdate: Partial<EditSuggestion> = {
            isComplete: true,
            replacementText: String(replacementText),
            explanation: explanation ? String(explanation) : undefined,
          };
          updateEditSuggestion(finalUpdate);
          setInlineEditStatus("previewing");

          // 获取完整的建议
          const completeSuggestion: EditSuggestion = {
            id: toolCallId,
            targetType: currentInlineEdit.targetType ?? "content",
            range: currentInlineEdit.range,
            originalText: String(originalText),
            replacementText: String(replacementText),
            explanation: explanation ? String(explanation) : undefined,
            isComplete: true,
          };
          onEditComplete?.(completeSuggestion);
          currentToolCallRef.current = null;
        }
      },

      onFinish: () => {
        // 使用 getState() 获取最新状态，避免闭包陷阱
        const currentInlineEdit = useWritingStore.getState().inlineEdit;
        // 如果没有收到 suggest_edit 工具调用，重置状态
        if (!currentInlineEdit.suggestion) {
          setInlineEditStatus("idle");
        }
      },

      onError: (err) => {
        setInlineEditError(err.message);
        onError?.(err);
        currentToolCallRef.current = null;
      },
    }
  );

  /** 创建临时会话 */
  const createTempSession = useCallback(async (): Promise<string | null> => {
    if (!projectId) {
      const err = new Error("缺少项目 ID");
      setInlineEditError(err.message);
      onError?.(err);
      return null;
    }

    setIsCreatingSession(true);
    try {
      const session = await createChatSession(projectId, {
        title: `内联编辑 - ${new Date().toLocaleString()}`,
      });
      setTempSessionId(session.id);
      return session.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setInlineEditError(error.message);
      onError?.(error);
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, [projectId, setInlineEditError, onError]);

  /** 请求编辑 */
  const requestEdit = useCallback(
    async (
      instruction: string,
      quickAction?: QuickAction,
      overrideOriginalText?: string // 直接传入的文本，避免闭包陷阱
    ) => {
      // 优先使用传入的文本，避免闭包捕获旧值
      const originalText = overrideOriginalText ?? inlineEdit.originalText;
      if (!originalText) {
        const err = new Error("缺少必要的编辑上下文");
        setInlineEditError(err.message);
        onError?.(err);
        return;
      }

      // 创建临时会话
      const sessionId = await createTempSession();
      if (!sessionId) return;

      setInlineEditStatus("streaming");

      // 构建请求
      const request: SendChatMessageRequest = {
        messages: [
          {
            role: "user",
            content: instruction,
          },
        ],
        state: {
          selected_text: originalText,
          inline_edit: true,
          context_entity_ids: contextEntities.map((e) => e.id),
          skill_id: quickAction?.skillId ?? selectedSkillId ?? undefined,
          chapter_title: title || undefined,
          chapter_outline: outline || undefined,
        },
      };

      await sendMessage(request, sessionId);
    },
    [
      inlineEdit.originalText,
      contextEntities,
      selectedSkillId,
      title,
      outline,
      sendMessage,
      createTempSession,
      setInlineEditStatus,
      setInlineEditError,
      onError,
    ]
  );

  /** 执行快捷操作 */
  const executeQuickAction = useCallback(
    async (
      action: QuickAction,
      selectedText: string,
      range: { from: number; to: number },
      targetType: EditTargetType = "content"
    ) => {
      // 先设置编辑上下文
      startInlineEdit(targetType, selectedText, range);

      // 直接传递 selectedText，避免闭包陷阱
      await requestEdit(action.instruction, action, selectedText);
    },
    [startInlineEdit, requestEdit]
  );

  /** 开始自定义编辑 */
  const startCustomEdit = useCallback(
    (
      selectedText: string,
      range: { from: number; to: number },
      targetType: EditTargetType = "content"
    ) => {
      startInlineEdit(targetType, selectedText, range);
    },
    [startInlineEdit]
  );

  /** 取消编辑 */
  const cancelEdit = useCallback(() => {
    cancel();
    cancelInlineEdit();
    currentToolCallRef.current = null;
    setTempSessionId(null);
  }, [cancel, cancelInlineEdit]);

  /** 清理会话（接受/拒绝后调用） */
  const cleanupSession = useCallback(() => {
    setTempSessionId(null);
  }, []);

  // 包装 acceptEdit 和 rejectEdit 以清理会话
  const handleAcceptEdit = useCallback(() => {
    acceptEdit();
    cleanupSession();
  }, [acceptEdit, cleanupSession]);

  const handleRejectEdit = useCallback(() => {
    rejectEdit();
    cleanupSession();
  }, [rejectEdit, cleanupSession]);

  return {
    // 状态
    inlineEdit,
    isStreaming,
    isCreatingSession,
    error,
    tempSessionId,

    // 操作
    executeQuickAction,
    startCustomEdit,
    requestEdit,
    acceptEdit: handleAcceptEdit,
    rejectEdit: handleRejectEdit,
    cancelEdit,
  };
}
