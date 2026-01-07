/**
 * 交互式细纲生成 Hook
 *
 * 处理 SSE 流式生成和决策点交互
 */

import { useCallback, useRef } from "react";
import { useInteractiveOutlineState } from "@/stores/writing-store";
import {
  streamStartOutlineGeneration,
  streamSubmitDecision,
  getOutlineDraft,
  abandonOutlineDraft,
} from "@/lib/api/interactive-outline";
import type {
  StartOutlineGenerationRequest,
  UserDecision,
  OutlineSSEEvent,
  OutlineDraft,
} from "@/types/interactive-outline";

/**
 * 交互式细纲生成 Hook
 */
export function useInteractiveOutline(projectId: string, chapterNumber: number | null) {
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

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 处理 SSE 事件
   */
  const handleSSEEvent = useCallback(
    (event: OutlineSSEEvent) => {
      switch (event.type) {
        case "RUN_STARTED":
          // 记录 draft ID (from threadId)
          if (event.threadId) {
            setOutlineDraftId(event.threadId);
          }
          break;

        case "STATE_DELTA":
          // 增量更新内容
          if (event.delta) {
            for (const op of event.delta) {
              // 处理内容追加
              if (op.op === "add" && typeof op.value === "string") {
                appendStreamingOutline(op.value);
              } else if (op.op === "add" && typeof op.value === "object" && op.value !== null) {
                // 处理 segment 对象
                const segment = op.value as { content?: string };
                if (segment.content) {
                  appendStreamingOutline(segment.content + "\n\n");
                }
              }
            }
          }
          break;

        case "RUN_FINISHED":
          if (event.outcome === "interrupt" && event.interrupt) {
            // 决策点
            setCurrentDecisionPoint(event.interrupt.payload);
            setOutlineGenerationStatus("decision");
          } else if (event.outcome === "success") {
            // 完成
            setOutlineGenerationStatus("completed");
            // 同步到章节细纲
            loadChapterOutline(streamingOutline);
          }
          break;

        case "STATE_SNAPSHOT":
          // 最终状态快照
          if (event.state?.outline) {
            const finalContent = formatOutlineSegments(event.state.outline);
            setStreamingOutline(finalContent);
            loadChapterOutline(finalContent);
          }
          break;

        case "RUN_ERROR":
          console.error("细纲生成错误:", event.message);
          setOutlineGenerationStatus("error");
          break;
      }
    },
    [
      setOutlineDraftId,
      appendStreamingOutline,
      setCurrentDecisionPoint,
      setOutlineGenerationStatus,
      loadChapterOutline,
      streamingOutline,
      setStreamingOutline,
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
      setActiveEditorTab("outline"); // 切换到细纲 tab

      abortControllerRef.current = new AbortController();

      try {
        const fullParams: StartOutlineGenerationRequest = {
          ...params,
          chapter_number: chapterNumber,
        };

        for await (const event of streamStartOutlineGeneration(
          projectId,
          fullParams,
          abortControllerRef.current.signal
        )) {
          handleSSEEvent(event);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("细纲生成失败:", err);
          setOutlineGenerationStatus("error");
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      projectId,
      chapterNumber,
      resetOutlineGeneration,
      setOutlineGenerationStatus,
      setActiveEditorTab,
      handleSSEEvent,
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

      abortControllerRef.current = new AbortController();

      try {
        for await (const event of streamSubmitDecision(
          projectId,
          outlineDraftId,
          decision,
          abortControllerRef.current.signal
        )) {
          handleSSEEvent(event);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("提交决策失败:", err);
          setOutlineGenerationStatus("error");
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      projectId,
      outlineDraftId,
      setOutlineGenerationStatus,
      setCurrentDecisionPoint,
      handleSSEEvent,
    ]
  );

  /**
   * 跳过决策（使用推荐值）
   */
  const skipDecision = useCallback(async () => {
    if (!currentDecisionPoint) return;

    // 找到推荐的选项
    const recommendedOption = currentDecisionPoint.options.find(
      (opt) => opt.recommended
    );

    const decision: UserDecision = {
      decision_point_id: currentDecisionPoint.id,
      chosen_option_id: recommendedOption?.id || currentDecisionPoint.options[0]?.id || null,
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
    abortControllerRef.current?.abort();
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
