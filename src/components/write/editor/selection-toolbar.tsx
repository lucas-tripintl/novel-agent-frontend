"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Expand,
  RefreshCw,
  Minimize2,
  MoreHorizontal,
  Wand2,
  ChevronDown,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import type { QuickAction, EditTargetType } from "@/types/inline-edit";
import { useQuickActionsConfig, useSelectedSkill } from "@/stores/writing-store";

/** 图标映射 */
const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-3.5 w-3.5" />,
  Expand: <Expand className="h-3.5 w-3.5" />,
  RefreshCw: <RefreshCw className="h-3.5 w-3.5" />,
  Minimize2: <Minimize2 className="h-3.5 w-3.5" />,
  Wand2: <Wand2 className="h-3.5 w-3.5" />,
};

interface SelectionToolbarProps {
  /** Tiptap 编辑器实例 */
  editor: Editor | null;
  /** 编辑目标类型 */
  targetType: EditTargetType;
  /** 快捷操作点击回调 */
  onQuickAction: (action: QuickAction, selectedText: string, range: { from: number; to: number }) => void;
  /** 打开自定义编辑（更多）回调 */
  onOpenCustomEdit: (selectedText: string, range: { from: number; to: number }) => void;
  /** 额外的类名 */
  className?: string;
}

interface ToolbarPosition {
  x: number;
  y: number;
  visible: boolean;
}

export function SelectionToolbar({
  editor,
  targetType,
  onQuickAction,
  onOpenCustomEdit,
  className,
}: SelectionToolbarProps) {
  const [position, setPosition] = useState<ToolbarPosition>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const { quickActionsConfig } = useQuickActionsConfig();
  const { selectedSkillId, selectedSkillInfo } = useSelectedSkill();

  // 获取启用的快捷操作
  const enabledActions = quickActionsConfig.actions.filter((action) =>
    quickActionsConfig.enabledIds.includes(action.id)
  );

  // 计算工具栏位置（基于视口坐标，用于 Portal fixed 定位）
  const updatePosition = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
      setPosition((prev) => ({ ...prev, visible: false }));
      setSelectedText("");
      setSelectionRange(null);
      return;
    }

    // 获取选中文本
    const text = editor.state.doc.textBetween(from, to);
    if (!text.trim()) {
      setPosition((prev) => ({ ...prev, visible: false }));
      return;
    }

    setSelectedText(text);
    setSelectionRange({ from, to });

    // 获取选区的 DOM 位置（视口坐标）
    const { view } = editor;
    const startCoords = view.coordsAtPos(from);
    const endCoords = view.coordsAtPos(to);

    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 200;
    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 40;

    // X 位置：选区中间，基于视口
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

    setPosition({
      x,
      y,
      visible: true,
    });
  }, [editor]);

  // 监听选区变化
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // 使用 requestAnimationFrame 确保 DOM 更新后计算位置
      requestAnimationFrame(updatePosition);
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("blur", () => {
      // 延迟隐藏，允许点击工具栏
      setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) {
          setPosition((prev) => ({ ...prev, visible: false }));
        }
      }, 200);
    });

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, updatePosition]);

  // 处理快捷操作点击
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (!selectedText || !selectionRange) return;
      onQuickAction(action, selectedText, selectionRange);
      setPosition((prev) => ({ ...prev, visible: false }));
    },
    [selectedText, selectionRange, onQuickAction]
  );

  // 处理"更多"点击
  const handleOpenCustomEdit = useCallback(() => {
    if (!selectedText || !selectionRange) return;
    onOpenCustomEdit(selectedText, selectionRange);
    setPosition((prev) => ({ ...prev, visible: false }));
  }, [selectedText, selectionRange, onOpenCustomEdit]);

  if (!position.visible || !selectedText) {
    return null;
  }

  // 使用 Portal 渲染到 body，突破父容器 overflow 限制
  const toolbar = (
    <div
      ref={toolbarRef}
      className={cn(
        "fixed z-50 flex items-center gap-1 p-1",
        "bg-popover border border-border rounded-lg shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
    >
      {/* 快捷操作按钮 */}
      {enabledActions.map((action) => (
        <Tooltip key={action.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => handleQuickAction(action)}
            >
              {action.icon && ICON_MAP[action.icon]}
              <span>{action.label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {action.instruction.slice(0, 30)}...
          </TooltipContent>
        </Tooltip>
      ))}

      {/* 分隔符 */}
      {enabledActions.length > 0 && (
        <div className="w-px h-5 bg-border mx-0.5" />
      )}

      {/* 技能选择（如果有选中技能） */}
      {selectedSkillInfo && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-primary"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span className="max-w-[60px] truncate">{selectedSkillInfo.name}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
            {selectedSkillInfo.description}
          </TooltipContent>
        </Tooltip>
      )}

      {/* 更多选项 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleOpenCustomEdit}>
            <Wand2 className="h-4 w-4 mr-2" />
            自定义编辑...
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* 显示未启用的快捷操作 */}
          {quickActionsConfig.actions
            .filter((action) => !quickActionsConfig.enabledIds.includes(action.id))
            .map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => handleQuickAction(action)}
              >
                {action.icon && ICON_MAP[action.icon]}
                <span className="ml-2">{action.label}</span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Portal 渲染到 body
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(toolbar, document.body);
}
