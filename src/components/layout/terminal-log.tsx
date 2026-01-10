"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

interface LogEntry {
  id: string;
  type: "info" | "analysis" | "warn" | "error" | "success";
  message: string;
  timestamp: Date;
  duration?: number;
}

// 模拟日志数据
const mockLogs: LogEntry[] = [
  {
    id: "1",
    type: "info",
    message: "系统启动完成",
    timestamp: new Date(),
  },
  {
    id: "2",
    type: "info",
    message: "等待任务...",
    timestamp: new Date(),
  },
];

export function TerminalLog() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "text-muted-foreground";
      case "analysis":
        return "text-neon-cyan";
      case "warn":
        return DESIGN_TOKENS.colors.warning;
      case "error":
        return "text-destructive";
      case "success":
        return "text-primary";
      default:
        return "text-foreground";
    }
  };

  const getLogPrefix = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "[INFO]";
      case "analysis":
        return "[ANALYSIS]";
      case "warn":
        return "[WARN]";
      case "error":
        return "[ERROR]";
      case "success":
        return "[SUCCESS]";
      default:
        return "[LOG]";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "border-t border-border/50 bg-terminal transition-all duration-300",
        isExpanded ? "h-48" : "h-10"
      )}
    >
      {/* Header */}
      <div
        className="flex h-10 cursor-pointer items-center justify-between border-b border-border/30 px-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">终端日志</span>
          <Badge
            variant="secondary"
            className="h-5 rounded-full px-2 text-xs bg-primary/10 text-primary"
          >
            {logs.length}
          </Badge>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Log Content */}
      {isExpanded && (
        <ScrollArea className="h-[calc(100%-2.5rem)]" ref={scrollRef}>
          <div className="p-3 font-mono text-xs space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-muted-foreground/60 shrink-0">
                  {formatTime(log.timestamp)}
                </span>
                <span className={cn("shrink-0 font-semibold", getLogColor(log.type))}>
                  {getLogPrefix(log.type)}
                </span>
                <span className="text-foreground/80">{log.message}</span>
                {log.duration !== undefined && (
                  <span className="text-muted-foreground/60">
                    ({log.duration}ms)
                  </span>
                )}
              </div>
            ))}
            {/* 闪烁的光标 */}
            <div className="flex items-center gap-1 text-primary">
              <span>{">"}</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

