"use client";

import { useSelectedTextContext, useEditorContent } from "@/stores/writing-store";
import { cn } from "@/lib/utils";
import { FileText, Type, X } from "lucide-react";

interface TextContextChipProps {
  className?: string;
}

export function TextContextChip({ className }: TextContextChipProps) {
  const { selectedTextContext, setSelectedTextContext } = useSelectedTextContext();
  const { content } = useEditorContent();

  // 如果未启用，不显示
  if (!selectedTextContext?.enabled) {
    return null;
  }

  const hasSelectedText = selectedTextContext.text !== null;
  const charCount = hasSelectedText
    ? selectedTextContext.charCount
    : content.length;

  // 格式化行范围显示
  const formatLineRange = () => {
    if (!selectedTextContext.lineRange) return "";
    const [from, to] = selectedTextContext.lineRange;
    if (from === to) return `L${from}`;
    return `L${from}-L${to}`;
  };

  const handleClose = () => {
    setSelectedTextContext({
      ...selectedTextContext,
      enabled: false,
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md",
        "bg-blue-500/10 border border-blue-500/20",
        "text-xs font-medium",
        "transition-colors hover:bg-blue-500/15",
        className
      )}
    >
      {hasSelectedText ? (
        <>
          <Type className="h-3 w-3 text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400">
            {formatLineRange()} ({charCount}字)
          </span>
        </>
      ) : (
        <>
          <FileText className="h-3 w-3 text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400">
            本章内容 {charCount > 0 && `(${charCount}字)`}
          </span>
        </>
      )}

      <button
        className="ml-0.5 hover:text-destructive transition-colors"
        onClick={handleClose}
        title="不包含文本上下文"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * 启用文本上下文的按钮（当上下文被关闭时显示）
 */
export function EnableTextContextButton({ className }: { className?: string }) {
  const { selectedTextContext, setSelectedTextContext } = useSelectedTextContext();

  // 如果已启用，不显示
  if (selectedTextContext?.enabled) {
    return null;
  }

  const handleEnable = () => {
    setSelectedTextContext({
      enabled: true,
      text: null,
      lineRange: null,
      charCount: 0,
    });
  };

  return (
    <button
      onClick={handleEnable}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md",
        "bg-muted/50 border border-border/50",
        "text-xs font-medium text-muted-foreground",
        "transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
      title="包含本章内容作为上下文"
    >
      <FileText className="h-3 w-3" />
      <span>+ 本章内容</span>
    </button>
  );
}
