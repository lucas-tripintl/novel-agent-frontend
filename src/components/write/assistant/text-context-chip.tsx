"use client";

import {
  useActiveContextSource,
  type ContextSourceType,
} from "@/stores/writing-store";
import { cn } from "@/lib/utils";
import { FileText, BookOpen, AlignLeft, Layers, Map, X } from "lucide-react";
import type { ComponentType } from "react";

interface TextContextChipProps {
  className?: string;
}

// 图标映射
const iconMap: Record<ContextSourceType, ComponentType<{ className?: string }>> = {
  "editor-content": BookOpen,
  "editor-outline": FileText,
  "editor-summary": AlignLeft,
  "entity-detail": Layers,
  "outline-detail": Map,
};

export function TextContextChip({ className }: TextContextChipProps) {
  const { activeContextSource, setActiveContextSource } = useActiveContextSource();

  // 如果未启用或无上下文，不显示
  if (!activeContextSource?.enabled) {
    return null;
  }

  const Icon = iconMap[activeContextSource.type];

  const handleDisable = () => {
    setActiveContextSource({
      ...activeContextSource,
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
      <Icon className="h-3 w-3 text-blue-500" />
      <span className="text-blue-600 dark:text-blue-400">
        {activeContextSource.label}
        {activeContextSource.charCount > 0 &&
          ` (${activeContextSource.charCount}字)`}
      </span>

      <button
        className="ml-0.5 hover:text-destructive transition-colors"
        onClick={handleDisable}
        title="不包含此上下文"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * 启用上下文的按钮（当上下文被关闭时显示）
 */
export function EnableTextContextButton({ className }: { className?: string }) {
  const { activeContextSource, setActiveContextSource } = useActiveContextSource();

  // 如果已启用，不显示
  if (activeContextSource?.enabled) {
    return null;
  }

  const handleEnable = () => {
    if (activeContextSource) {
      // 重新启用当前上下文
      setActiveContextSource({
        ...activeContextSource,
        enabled: true,
      });
    } else {
      // 默认启用正文上下文
      setActiveContextSource({
        type: "editor-content",
        label: "本章正文",
        charCount: 0,
        enabled: true,
      });
    }
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
      title="包含上下文"
    >
      <FileText className="h-3 w-3" />
      <span>+ 上下文</span>
    </button>
  );
}
