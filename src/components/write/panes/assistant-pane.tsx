"use client";

import { useState, useRef, useEffect } from "react";
import {
  useWritingStore,
  useWritingMode,
  useContextEntities,
  useChatMessages,
  useStreamingState,
} from "@/stores/writing-store";
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
  X,
  User as UserIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { SelectedContext } from "../assistant/selected-context";
import { ChatMessage } from "../assistant/chat-message";

interface AssistantPaneProps {
  projectId: string;
}

export function AssistantPane({ projectId }: AssistantPaneProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mode = useWritingMode();
  const contextEntities = useContextEntities();
  const messages = useChatMessages();
  const { isStreaming } = useStreamingState();
  const { addMessage, clearMessages } = useWritingStore();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming) return;

    // 添加用户消息
    addMessage({
      role: "user",
      type: "text",
      content: inputValue.trim(),
    });

    // TODO: 发送到 AI 服务
    console.log("发送消息:", inputValue);

    setInputValue("");

    // 模拟 AI 回复
    setTimeout(() => {
      addMessage({
        role: "assistant",
        type: "text",
        content: "收到你的消息，正在思考中...",
        isComplete: true,
      });
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={clearMessages}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* 当前上下文设定 */}
      <SelectedContext entities={contextEntities} mode={mode} />

      {/* 对话区域 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
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
            messages.map((message) => (
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
          <Button
            size="icon"
            className={cn(
              "absolute right-2 bottom-2 h-8 w-8",
              !inputValue.trim() && "opacity-50"
            )}
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
