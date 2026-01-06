"use client";

import type { ToolCallState } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Wrench, Check, Loader2 } from "lucide-react";

// 工具名称到中文的映射
const TOOL_NAME_MAP: Record<string, string> = {
  search_entities: "搜索设定",
  query_context: "查询上下文",
  submit_chapter_task: "提交章节任务",
  submit_outline_task: "提交大纲任务",
  suggest_edit: "建议编辑",
};

function getToolDisplayName(toolName: string): string {
  return TOOL_NAME_MAP[toolName] || toolName;
}

interface ToolCallIndicatorProps {
  toolCalls: ToolCallState[];
  className?: string;
}

export function ToolCallIndicator({
  toolCalls,
  className,
}: ToolCallIndicatorProps) {
  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "px-4 py-2 border-b border-border/50 bg-muted/30",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Wrench className="h-3.5 w-3.5 animate-pulse text-primary" />
        <span>正在使用工具:</span>
        <div className="flex flex-wrap gap-2">
          {toolCalls.map((tc) => (
            <span
              key={tc.id}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
                tc.isComplete
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              )}
            >
              {getToolDisplayName(tc.name)}
              {tc.isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
