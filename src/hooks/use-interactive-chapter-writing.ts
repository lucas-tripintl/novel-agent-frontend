/**
 * 交互式章节正文生成 Hook
 *
 * 使用 AG-UI SDK 处理 SSE 流式生成和决策点交互
 */

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  AgentSubscriber,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  StateDeltaEvent,
  StateSnapshotEvent,
  TextMessageContentEvent,
} from "@ag-ui/client";
import { useInteractiveContentState } from "@/stores/writing-store";
import { ChapterWritingAgent } from "@/lib/api/chapter-writing-agent";
import { ChapterWritingDecisionAgent } from "@/lib/api/chapter-writing-decision-agent";
import {
  getChapterDraft,
  abandonChapterDraft,
  confirmChapterDraft,
} from "@/lib/api/chapter-writing";
import { projectKeys } from "@/hooks/use-projects";
import type {
  StartChapterWritingRequest,
  ChapterWritingDraft,
  ChapterRunResult,
} from "@/types/chapter-writing";
import type { UserDecision } from "@/types/interactive-outline";

// 获取存储的 token
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

/**
 * 交互式章节正文生成 Hook
 */
export function useInteractiveChapterWriting(
  projectId: string,
  chapterNumber: number | null
) {
  const queryClient = useQueryClient();
  const {
    contentGenerationStatus,
    streamingContentText,
    contentDecisionPoint,
    contentDraftId,
    contentGenerationError,
    setContentGenerationStatus,
    setStreamingContentText,
    appendStreamingContentText,
    setContentDecisionPoint,
    setContentDraftId,
    resetContentGeneration,
    setActiveEditorTab,
    setContent,
    enterContentGenerationCollabMode,
    exitContentGenerationCollabMode,
    setContentGenerationError,
    clearContentGenerationError,
  } = useInteractiveContentState();

  const agentRef = useRef<ChapterWritingAgent | ChapterWritingDecisionAgent | null>(null);

  /**
   * 创建 AG-UI Subscriber
   */
  const createSubscriber = useCallback(
    (): AgentSubscriber => ({
      onRunStartedEvent: ({ event }) => {
        const e = event as RunStartedEvent;
        if (e.threadId) {
          setContentDraftId(e.threadId);
        }
      },

      // 处理 TEXT_MESSAGE_CONTENT 事件（流式文本）
      onTextMessageContentEvent: ({ event }) => {
        const e = event as TextMessageContentEvent;
        if (e.delta) {
          appendStreamingContentText(e.delta);
        }
      },

      // 处理 STATE_DELTA 事件（兼容旧格式）
      onStateDeltaEvent: ({ event }) => {
        const e = event as StateDeltaEvent;
        if (e.delta) {
          for (const op of e.delta) {
            if (op.op === "add" && typeof op.value === "string") {
              appendStreamingContentText(op.value);
            } else if (
              op.op === "add" &&
              typeof op.value === "object" &&
              op.value !== null
            ) {
              const segment = op.value as { content?: string };
              if (segment.content) {
                appendStreamingContentText(segment.content);
              }
            }
          }
        }
      },

      onStateSnapshotEvent: ({ event }) => {
        const e = event as StateSnapshotEvent;
        const snapshot = e.snapshot as ChapterRunResult["state"];
        if (snapshot?.content) {
          setStreamingContentText(snapshot.content);
        }
      },

      onRunFinishedEvent: ({ event }) => {
        const e = event as RunFinishedEvent;
        const result = e.result as ChapterRunResult | undefined;

        console.log("[ChapterWriting] RunFinished event:", { result });

        if (!result) {
          // 没有结果时重置为 idle
          console.warn("[ChapterWriting] RunFinished 无 result，重置为 idle");
          setContentGenerationStatus("idle");
          return;
        }

        if (result.outcome === "interrupt" && result.interrupt) {
          console.log("[ChapterWriting] 收到决策点:", result.interrupt.payload);
          setContentDecisionPoint(result.interrupt.payload);
          setContentGenerationStatus("decision");
        } else if (result.outcome === "success") {
          console.log("[ChapterWriting] 生成成功，内容长度:", result.content?.length);
          setContentGenerationStatus("completed");
          if (result.content) {
            setStreamingContentText(result.content);
          }
        } else if (result.outcome === "error") {
          // 打印错误信息便于调试（使用 warn 因为是业务错误）
          console.warn("[ChapterWriting] 生成错误:", JSON.stringify(result, null, 2));

          // 提取错误消息
          // result.error.message 可能是字符串或嵌套对象 { message: string }
          const errorCode = result.error?.code || "UNKNOWN_ERROR";
          const errorMsg = result.error?.message;
          let displayMsg = "正文生成失败";
          if (typeof errorMsg === "string") {
            displayMsg = errorMsg;
          } else if (typeof errorMsg === "object" && errorMsg !== null) {
            displayMsg = (errorMsg as { message?: string }).message || displayMsg;
          }

          // 设置错误状态（用于显示错误对话框）
          setContentGenerationError({ code: errorCode, message: displayMsg });

          setContentGenerationStatus("error");
          // 错误时退出协作模式
          exitContentGenerationCollabMode();
        } else {
          console.warn("[ChapterWriting] 未知 outcome:", result.outcome, result);
          setContentGenerationStatus("idle");
        }
      },

      onRunErrorEvent: ({ event }) => {
        const e = event as RunErrorEvent;
        console.error("[ChapterWriting] RunError:", e.message);
        setContentGenerationError({
          code: "RUN_ERROR",
          message: e.message || "正文生成失败",
        });
        setContentGenerationStatus("error");
        exitContentGenerationCollabMode();
      },
    }),
    [
      setContentDraftId,
      appendStreamingContentText,
      setStreamingContentText,
      setContentDecisionPoint,
      setContentGenerationStatus,
      setContentGenerationError,
      exitContentGenerationCollabMode,
    ]
  );

  /**
   * 开始生成
   */
  const startGeneration = useCallback(
    async (params: Omit<StartChapterWritingRequest, "chapter_number">) => {
      if (!chapterNumber) {
        console.error("章节号为空，无法生成正文");
        return;
      }

      // 重置状态
      resetContentGeneration();
      setContentGenerationStatus("generating");
      setActiveEditorTab("content");

      // 进入生成协作模式（自动展开右侧面板）
      enterContentGenerationCollabMode();

      const token = getStoredToken();
      const agent = new ChapterWritingAgent({
        projectId,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      agent.setRequestBody({
        ...params,
        chapter_number: chapterNumber,
      });

      agentRef.current = agent;

      try {
        await agent.runAgent({}, createSubscriber());
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("正文生成失败:", err);
          setContentGenerationStatus("error");
        }
      } finally {
        agentRef.current = null;
      }
    },
    [
      projectId,
      chapterNumber,
      resetContentGeneration,
      setContentGenerationStatus,
      setActiveEditorTab,
      enterContentGenerationCollabMode,
      createSubscriber,
    ]
  );

  /**
   * 提交决策
   */
  const submitDecision = useCallback(
    async (decision: UserDecision) => {
      if (!contentDraftId) {
        console.error("草稿 ID 为空，无法提交决策");
        return;
      }

      setContentGenerationStatus("generating");
      setContentDecisionPoint(null);

      const token = getStoredToken();
      const agent = new ChapterWritingDecisionAgent({
        projectId,
        draftId: contentDraftId,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      agent.setDecision(decision);
      agentRef.current = agent;

      try {
        await agent.runAgent({}, createSubscriber());
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("提交决策失败:", err);
          setContentGenerationStatus("error");
        }
      } finally {
        agentRef.current = null;
      }
    },
    [
      projectId,
      contentDraftId,
      setContentGenerationStatus,
      setContentDecisionPoint,
      createSubscriber,
    ]
  );

  /**
   * 跳过决策（使用推荐值）
   */
  const skipDecision = useCallback(async () => {
    if (!contentDecisionPoint) return;

    const recommendedOption = contentDecisionPoint.options.find(
      (opt) => opt.recommended
    );

    const decision: UserDecision = {
      decision_point_id: contentDecisionPoint.id,
      chosen_option_id:
        recommendedOption?.id || contentDecisionPoint.options[0]?.id || null,
      custom_input: null,
      skipped: true,
    };

    await submitDecision(decision);
  }, [contentDecisionPoint, submitDecision]);

  /**
   * 选择决策选项
   */
  const selectOption = useCallback(
    async (optionId: string) => {
      if (!contentDecisionPoint) return;

      const decision: UserDecision = {
        decision_point_id: contentDecisionPoint.id,
        chosen_option_id: optionId,
        custom_input: null,
        skipped: false,
      };

      await submitDecision(decision);
    },
    [contentDecisionPoint, submitDecision]
  );

  /**
   * 提交自定义输入
   */
  const submitCustomInput = useCallback(
    async (customInput: string) => {
      if (!contentDecisionPoint) return;

      const decision: UserDecision = {
        decision_point_id: contentDecisionPoint.id,
        chosen_option_id: null,
        custom_input: customInput,
        skipped: false,
      };

      await submitDecision(decision);
    },
    [contentDecisionPoint, submitDecision]
  );

  /**
   * 停止生成
   */
  const stopGeneration = useCallback(() => {
    agentRef.current?.abortRun();
    resetContentGeneration();
    exitContentGenerationCollabMode();
  }, [resetContentGeneration, exitContentGenerationCollabMode]);

  /**
   * 检查是否有未完成草稿
   */
  const checkDraft = useCallback(async (): Promise<ChapterWritingDraft | null> => {
    if (!chapterNumber) return null;

    try {
      const response = await getChapterDraft(projectId, chapterNumber);
      if (response.has_draft && response.draft) {
        return response.draft;
      }
    } catch (err) {
      console.error("检查草稿失败:", err);
    }

    return null;
  }, [projectId, chapterNumber]);

  /**
   * 放弃草稿
   */
  const abandonDraft = useCallback(async () => {
    if (!contentDraftId) return;

    try {
      await abandonChapterDraft(projectId, contentDraftId);
      resetContentGeneration();
      exitContentGenerationCollabMode();
    } catch (err) {
      console.error("放弃草稿失败:", err);
    }
  }, [projectId, contentDraftId, resetContentGeneration, exitContentGenerationCollabMode]);

  /**
   * 确认保存正文
   */
  const confirmCompletion = useCallback(async () => {
    if (!contentDraftId) return;

    try {
      const result = await confirmChapterDraft(projectId, contentDraftId);

      // 更新编辑器内容：优先使用后端返回的内容，否则使用流式积累的内容
      const finalContent = result.result?.content || streamingContentText;
      if (finalContent) {
        setContent(finalContent);
      }

      // 刷新章节数据（使用正确的 queryKey）
      queryClient.invalidateQueries({ queryKey: projectKeys.chapters(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.chapter(projectId, chapterNumber!) });

      // 重置生成状态
      resetContentGeneration();
      exitContentGenerationCollabMode();

      return result;
    } catch (err) {
      console.error("确认保存失败:", err);
      throw err;
    }
  }, [
    projectId,
    contentDraftId,
    streamingContentText,
    setContent,
    queryClient,
    resetContentGeneration,
    exitContentGenerationCollabMode,
  ]);

  return {
    // 状态
    status: contentGenerationStatus,
    streamingContent: streamingContentText,
    currentDecision: contentDecisionPoint,
    draftId: contentDraftId,
    error: contentGenerationError,
    isGenerating: contentGenerationStatus === "generating",
    isWaitingDecision: contentGenerationStatus === "decision",
    isCompleted: contentGenerationStatus === "completed",
    isError: contentGenerationStatus === "error",

    // 方法
    startGeneration,
    submitDecision,
    skipDecision,
    selectOption,
    submitCustomInput,
    stopGeneration,
    clearError: clearContentGenerationError,
    checkDraft,
    abandonDraft,
    confirmCompletion,
    reset: resetContentGeneration,
  };
}
