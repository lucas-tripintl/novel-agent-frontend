"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";

interface InlineEditActionsProps {
  /** 是否流式完成 */
  isComplete: boolean;
  /** 是否正在流式生成 */
  isStreaming?: boolean;
  /** 修改说明 */
  explanation?: string;
  /** 接受编辑 */
  onAccept: () => void;
  /** 拒绝编辑 */
  onReject: () => void;
  /** 重新生成 */
  onRegenerate?: () => void;
  /** 额外的类名 */
  className?: string;
}

export function InlineEditActions({
  isComplete,
  isStreaming = false,
  explanation,
  onAccept,
  onReject,
  onRegenerate,
  className,
}: InlineEditActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2",
        "bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
        className
      )}
    >
      {/* 流式生成指示 */}
      {isStreaming && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>生成中...</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        {/* 接受 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-2 gap-1",
                "text-green-600 hover:text-green-700 hover:bg-green-100",
                "dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30"
              )}
              onClick={onAccept}
              disabled={!isComplete || isStreaming}
            >
              <Check className="h-4 w-4" />
              <span className="text-xs">接受</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            接受修改 (⌘+Enter)
          </TooltipContent>
        </Tooltip>

        {/* 拒绝 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-2 gap-1",
                "text-red-600 hover:text-red-700 hover:bg-red-100",
                "dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
              )}
              onClick={onReject}
            >
              <X className="h-4 w-4" />
              <span className="text-xs">拒绝</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            拒绝修改 (Esc)
          </TooltipContent>
        </Tooltip>

        {/* 重新生成 */}
        {onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={onRegenerate}
                disabled={isStreaming}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              重新生成
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/** 浮动版本的操作栏 */
interface FloatingInlineEditActionsProps extends InlineEditActionsProps {
  /** 位置 */
  position: { x: number; y: number };
}

export function FloatingInlineEditActions({
  position,
  ...props
}: FloatingInlineEditActionsProps) {
  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <InlineEditActions {...props} />
    </div>
  );
}
