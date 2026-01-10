"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, getStatusButtonClasses } from "@/lib/design-tokens";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface InlineEditActionsProps {
  /** 是否流式完成 */
  isComplete: boolean;
  /** 是否正在流式生成 */
  isStreaming?: boolean;
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
  onAccept,
  onReject,
  onRegenerate,
  className,
}: InlineEditActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1",
        "bg-popover border border-border rounded-lg shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
      onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
    >
      {/* 流式生成指示 */}
      {isStreaming && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>生成中...</span>
        </div>
      )}

      {/* 接受 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 text-xs gap-1", getStatusButtonClasses('success'))}
            onClick={onAccept}
            disabled={!isComplete || isStreaming}
          >
            <Check className="h-3.5 w-3.5" />
            <span>接受</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          接受修改 (⌘+Enter)
        </TooltipContent>
      </Tooltip>

      {/* 拒绝 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 text-xs gap-1", getStatusButtonClasses('error'))}
            onClick={onReject}
          >
            <X className="h-3.5 w-3.5" />
            <span>拒绝</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          拒绝修改 (Esc)
        </TooltipContent>
      </Tooltip>

      {/* 分隔符 */}
      {onRegenerate && <div className="w-px h-5 bg-border mx-0.5" />}

      {/* 重新生成 */}
      {onRegenerate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={onRegenerate}
              disabled={isStreaming}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            重新生成
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

/** 浮动版本的操作栏（基于编辑器选区定位） */
interface FloatingInlineEditActionsProps extends InlineEditActionsProps {
  /** Tiptap 编辑器实例 */
  editor: Editor | null;
  /** 选区范围 */
  range: { from: number; to: number } | null;
}

export function FloatingInlineEditActions({
  editor,
  range,
  ...props
}: FloatingInlineEditActionsProps) {
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 计算工具栏位置（视口坐标，用于 fixed 定位）
  const updatePosition = useCallback(() => {
    if (!editor || !range) {
      setPosition((prev) => ({ ...prev, visible: false }));
      return;
    }

    const { view } = editor;
    const startCoords = view.coordsAtPos(range.from);
    const endCoords = view.coordsAtPos(range.to);

    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 200;
    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 40;

    // X 位置：选区中间
    const centerX = (startCoords.left + endCoords.right) / 2;
    let x = centerX - toolbarWidth / 2;

    // X 边界检查（视口）
    x = Math.max(8, Math.min(x, window.innerWidth - toolbarWidth - 8));

    // Y 位置：优先显示在选区上方
    let y = startCoords.top - toolbarHeight - 8;

    // Y 边界检查：上方空间不足则显示在选区下方
    if (y < 8) {
      y = endCoords.bottom + 8;
    }

    setPosition({ x, y, visible: true });
  }, [editor, range]);

  // 监听选区/范围变化、resize、滚动，重新计算位置
  useEffect(() => {
    // 使用 requestAnimationFrame 确保 DOM 更新后计算位置
    const frameId = requestAnimationFrame(updatePosition);

    const handleResize = () => requestAnimationFrame(updatePosition);
    const handleScroll = () => requestAnimationFrame(updatePosition);

    window.addEventListener("resize", handleResize);
    // 捕获阶段监听，确保能捕获到各种滚动容器
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [updatePosition]);

  if (!position.visible) {
    return null;
  }

  // 使用 Portal 渲染到 body，突破父容器 overflow 限制
  const toolbar = (
    <div
      ref={toolbarRef}
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
    >
      <InlineEditActions {...props} />
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(toolbar, document.body);
}
