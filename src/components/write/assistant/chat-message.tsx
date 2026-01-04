"use client";

import type { ChatMessage as ChatMessageType } from "@/types/writing";
import { cn } from "@/lib/utils";
import { Bot, User, AlertCircle, Loader2 } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isError = message.type === "error";
  const isStreaming = !message.isComplete && message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse"
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
          isUser
            ? "bg-primary text-primary-foreground"
            : isError
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* 消息内容 */}
      <div
        className={cn(
          "flex-1 max-w-[85%]",
          isUser && "flex justify-end"
        )}
      >
        <div
          className={cn(
            "px-3 py-2 rounded-lg text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : isError
              ? "bg-destructive/10 border border-destructive/20 text-destructive"
              : "bg-muted/50 border border-border/50"
          )}
        >
          {/* 消息文本 */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* 流式指示器 */}
          {isStreaming && (
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="inline-block w-1.5 h-4 bg-primary/50 animate-pulse" />
            </span>
          )}
        </div>

        {/* 时间戳 */}
        <div
          className={cn(
            "mt-1 text-[10px] text-muted-foreground",
            isUser && "text-right"
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
