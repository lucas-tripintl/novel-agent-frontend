/**
 * 交互式细纲生成 Hook
 *
 * 使用 AG-UI SDK 处理 SSE 流式生成和决策点交互
 */

import { useCallback, useRef } from "react";
import type {
  AgentSubscriber,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  StateDeltaEvent,
  StateSnapshotEvent,
} from "@ag-ui/client";
import { useInteractiveOutlineState } from "@/stores/writing-store";
import { OutlineAgent } from "@/lib/api/outline-agent";
import { DecisionAgent } from "@/lib/api/decision-agent";
import {
  getOutlineDraft,
  abandonOutlineDraft,
} from "@/lib/api/interactive-outline";
import type {
  StartOutlineGenerationRequest,
  UserDecision,
  OutlineDraft,
  OutlineRunResult,
} from "@/types/interactive-outline";

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
 * 交互式细纲生成 Hook
 */
export function useInteractiveOutline(
  projectId: string,
  chapterNumber: number | null
) {
  const {
    outlineGenerationStatus,
    streamingOutline,
    currentDecisionPoint,
    outlineDraftId,
    setOutlineGenerationStatus,
    setStreamingOutline,
    appendStreamingOutline,
    setCurrentDecisionPoint,
    setOutlineDraftId,
    resetOutlineGeneration,
    setActiveEditorTab,
    loadChapterOutline,
  } = useInteractiveOutlineState();

  const agentRef = useRef<OutlineAgent | DecisionAgent | null>(null);

  /**
   * 创建 AG-UI Subscriber
   */
  const createSubscriber = useCallback(
    (): AgentSubscriber => ({
      onRunStartedEvent: ({ event }) => {
        const e = event as RunStartedEvent;
        if (e.threadId) {
          setOutlineDraftId(e.threadId);
        }
      },

      onStateDeltaEvent: ({ event }) => {
        const e = event as StateDeltaEvent;
        if (e.delta) {
          for (const op of e.delta) {
            if (op.op === "add" && typeof op.value === "string") {
              appendStreamingOutline(op.value);
            } else if (
              op.op === "add" &&
              typeof op.value === "object" &&
              op.value !== null
            ) {
              const segment = op.value as { content?: string };
              if (segment.content) {
                appendStreamingOutline(segment.content + "\n\n");
              }
            }
          }
        }
      },

      onStateSnapshotEvent: ({ event }) => {
        const e = event as StateSnapshotEvent;
        const snapshot = e.snapshot as OutlineRunResult["state"];
        if (snapshot?.output) {
          setStreamingOutline(snapshot.output);
          loadChapterOutline(snapshot.output);
        } else if (snapshot?.segments) {
          const finalContent = formatOutlineSegments(snapshot.segments);
          setStreamingOutline(finalContent);
          loadChapterOutline(finalContent);
        }
      },

      onRunFinishedEvent: ({ event }) => {
        const e = event as RunFinishedEvent;
        const result = e.result as OutlineRunResult | undefined;

        if (!result) return;

        if (result.outcome === "interrupt" && result.interrupt) {
          setCurrentDecisionPoint(result.interrupt.payload);
          setOutlineGenerationStatus("decision");
        } else if (result.outcome === "success") {
          setOutlineGenerationStatus("completed");
          if (result.state?.output) {
            setStreamingOutline(result.state.output);
            loadChapterOutline(result.state.output);
          } else if (result.state?.segments) {
            const finalContent = formatOutlineSegments(result.state.segments);
            setStreamingOutline(finalContent);
            loadChapterOutline(finalContent);
          }
        }
      },

      onRunErrorEvent: ({ event }) => {
        const e = event as RunErrorEvent;
        console.error("细纲生成错误:", e.message);
        setOutlineGenerationStatus("error");
      },
    }),
    [
      setOutlineDraftId,
      appendStreamingOutline,
      setStreamingOutline,
      setCurrentDecisionPoint,
      setOutlineGenerationStatus,
      loadChapterOutline,
    ]
  );

  /**
   * 开始生成
   */
  const startGeneration = useCallback(
    async (params: Omit<StartOutlineGenerationRequest, "chapter_number">) => {
      if (!chapterNumber) {
        console.error("章节号为空，无法生成细纲");
        return;
      }

      // 重置状态
      resetOutlineGeneration();
      setOutlineGenerationStatus("generating");
      setActiveEditorTab("outline");

      const token = getStoredToken();
      const agent = new OutlineAgent({
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
          console.error("细纲生成失败:", err);
          setOutlineGenerationStatus("error");
        }
      } finally {
        agentRef.current = null;
      }
    },
    [
      projectId,
      chapterNumber,
      resetOutlineGeneration,
      setOutlineGenerationStatus,
      setActiveEditorTab,
      createSubscriber,
    ]
  );

  /**
   * 提交决策
   */
  const submitDecision = useCallback(
    async (decision: UserDecision) => {
      if (!outlineDraftId) {
        console.error("草稿 ID 为空，无法提交决策");
        return;
      }

      setOutlineGenerationStatus("generating");
      setCurrentDecisionPoint(null);

      const token = getStoredToken();
      const agent = new DecisionAgent({
        projectId,
        draftId: outlineDraftId,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      agent.setDecision(decision);
      agentRef.current = agent;

      try {
        await agent.runAgent({}, createSubscriber());
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("提交决策失败:", err);
          setOutlineGenerationStatus("error");
        }
      } finally {
        agentRef.current = null;
      }
    },
    [
      projectId,
      outlineDraftId,
      setOutlineGenerationStatus,
      setCurrentDecisionPoint,
      createSubscriber,
    ]
  );

  /**
   * 跳过决策（使用推荐值）
   */
  const skipDecision = useCallback(async () => {
    if (!currentDecisionPoint) return;

    const recommendedOption = currentDecisionPoint.options.find(
      (opt) => opt.recommended
    );

    const decision: UserDecision = {
      decision_point_id: currentDecisionPoint.id,
      chosen_option_id:
        recommendedOption?.id || currentDecisionPoint.options[0]?.id || null,
      custom_input: null,
      skipped: true,
    };

    await submitDecision(decision);
  }, [currentDecisionPoint, submitDecision]);

  /**
   * 选择决策选项
   */
  const selectOption = useCallback(
    async (optionId: string) => {
      if (!currentDecisionPoint) return;

      const decision: UserDecision = {
        decision_point_id: currentDecisionPoint.id,
        chosen_option_id: optionId,
        custom_input: null,
        skipped: false,
      };

      await submitDecision(decision);
    },
    [currentDecisionPoint, submitDecision]
  );

  /**
   * 提交自定义输入
   */
  const submitCustomInput = useCallback(
    async (customInput: string) => {
      if (!currentDecisionPoint) return;

      const decision: UserDecision = {
        decision_point_id: currentDecisionPoint.id,
        chosen_option_id: null,
        custom_input: customInput,
        skipped: false,
      };

      await submitDecision(decision);
    },
    [currentDecisionPoint, submitDecision]
  );

  /**
   * 停止生成
   */
  const stopGeneration = useCallback(() => {
    agentRef.current?.abortRun();
    setOutlineGenerationStatus("idle");
  }, [setOutlineGenerationStatus]);

  /**
   * 检查是否有未完成草稿
   */
  const checkDraft = useCallback(async (): Promise<OutlineDraft | null> => {
    if (!chapterNumber) return null;

    try {
      const response = await getOutlineDraft(projectId, chapterNumber);
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
    if (!outlineDraftId) return;

    try {
      await abandonOutlineDraft(projectId, outlineDraftId);
      resetOutlineGeneration();
    } catch (err) {
      console.error("放弃草稿失败:", err);
    }
  }, [projectId, outlineDraftId, resetOutlineGeneration]);

  return {
    // 状态
    status: outlineGenerationStatus,
    streamingContent: streamingOutline,
    currentDecision: currentDecisionPoint,
    draftId: outlineDraftId,
    isGenerating: outlineGenerationStatus === "generating",
    isWaitingDecision: outlineGenerationStatus === "decision",
    isCompleted: outlineGenerationStatus === "completed",
    isError: outlineGenerationStatus === "error",

    // 方法
    startGeneration,
    submitDecision,
    skipDecision,
    selectOption,
    submitCustomInput,
    stopGeneration,
    checkDraft,
    abandonDraft,
    reset: resetOutlineGeneration,
  };
}

/**
 * 格式化大纲片段为文本
 */
function formatOutlineSegments(segments: unknown[]): string {
  if (!Array.isArray(segments)) return "";

  return segments
    .map((segment) => {
      if (typeof segment === "string") return segment;
      if (typeof segment === "object" && segment !== null) {
        const s = segment as { content?: string; title?: string };
        if (s.content) return s.content;
        if (s.title) return `## ${s.title}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}
