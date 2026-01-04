/**
 * 流式写作 Hook
 *
 * 封装 SSE 流式写作逻辑，支持取消、回调等
 */

import { useState, useCallback, useRef } from "react";
import { streamWrite, streamReview } from "@/lib/api/writing";
import { useWritingStore } from "@/stores/writing-store";
import type { StreamWriteParams, ReviewParams, StreamEvent, SelectedEntity } from "@/types/writing";

interface UseStreamWriteOptions {
  onChunk?: (text: string) => void;
  onContext?: (entities: SelectedEntity[]) => void;
  onDone?: (totalChars: number) => void;
  onError?: (error: Error) => void;
}

export function useStreamWrite(options: UseStreamWriteOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    setStreaming,
    appendStreamingBuffer,
    clearStreamingBuffer,
    setAutoSelectedEntities,
    addMessage,
    updateLastMessage,
  } = useWritingStore();

  const startWrite = useCallback(
    async (params: StreamWriteParams) => {
      // 清理之前的状态
      setError(null);
      clearStreamingBuffer();
      setIsStreaming(true);
      setStreaming(true);

      // 创建 AbortController
      abortControllerRef.current = new AbortController();

      // 添加 AI 消息占位
      addMessage({
        role: "assistant",
        type: "text",
        content: "",
        isComplete: false,
      });

      try {
        let totalText = "";

        for await (const event of streamWrite(
          params,
          abortControllerRef.current.signal
        )) {
          switch (event.type) {
            case "context":
              // AI 自动选择的设定
              if (event.autoSelectedEntities) {
                setAutoSelectedEntities(event.autoSelectedEntities);
                options.onContext?.(event.autoSelectedEntities);
              }
              break;

            case "content":
              // 内容片段
              if (event.text) {
                totalText += event.text;
                appendStreamingBuffer(event.text);
                updateLastMessage(totalText, false);
                options.onChunk?.(event.text);
              }
              break;

            case "thinking":
              // AI 思考过程（可选展示）
              console.log("AI thinking:", event.thinking);
              break;

            case "done":
              // 完成
              updateLastMessage(totalText, true);
              options.onDone?.(event.totalChars || totalText.length);
              break;

            case "error":
              // 错误
              const err = new Error(event.message || "写作过程中出错");
              setError(err);
              options.onError?.(err);
              break;
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // 用户主动取消
          console.log("写作已取消");
        } else {
          const error = err as Error;
          setError(error);
          options.onError?.(error);

          // 更新消息为错误状态
          addMessage({
            role: "assistant",
            type: "error",
            content: error.message || "写作过程中出错",
            isComplete: true,
          });
        }
      } finally {
        setIsStreaming(false);
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      setStreaming,
      appendStreamingBuffer,
      clearStreamingBuffer,
      setAutoSelectedEntities,
      addMessage,
      updateLastMessage,
      options,
    ]
  );

  const stopWrite = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    isStreaming,
    error,
    startWrite,
    stopWrite,
  };
}

/**
 * 流式审稿 Hook
 */
export function useStreamReview(options: UseStreamWriteOptions = {}) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { addMessage, updateLastMessage } = useWritingStore();

  const startReview = useCallback(
    async (params: ReviewParams) => {
      setError(null);
      setIsReviewing(true);

      abortControllerRef.current = new AbortController();

      addMessage({
        role: "assistant",
        type: "text",
        content: "正在审阅...",
        isComplete: false,
      });

      try {
        let reviewContent = "";

        for await (const event of streamReview(
          params,
          abortControllerRef.current.signal
        )) {
          switch (event.type) {
            case "content":
              if (event.text) {
                reviewContent += event.text;
                updateLastMessage(reviewContent, false);
                options.onChunk?.(event.text);
              }
              break;

            case "done":
              updateLastMessage(reviewContent, true);
              options.onDone?.(reviewContent.length);
              break;

            case "error":
              const err = new Error(event.message || "审稿过程中出错");
              setError(err);
              options.onError?.(err);
              break;
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const error = err as Error;
          setError(error);
          options.onError?.(error);

          addMessage({
            role: "assistant",
            type: "error",
            content: error.message || "审稿过程中出错",
            isComplete: true,
          });
        }
      } finally {
        setIsReviewing(false);
        abortControllerRef.current = null;
      }
    },
    [addMessage, updateLastMessage, options]
  );

  const stopReview = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    isReviewing,
    error,
    startReview,
    stopReview,
  };
}
