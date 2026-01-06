"use client";

import { useState } from "react";
import { useWritingStore } from "@/stores/writing-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
} from "lucide-react";
import { SimpleTiptapEditor } from "./simple-tiptap-editor";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import type { QuickAction } from "@/types/inline-edit";

interface ChapterHeaderProps {
  chapterNumber: number;
}

export function ChapterHeader({ chapterNumber }: ChapterHeaderProps) {
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const { projectId, title, outline, setTitle, setOutline } = useWritingStore();

  // 内联编辑 hook
  const {
    inlineEdit,
    executeQuickAction,
    startCustomEdit,
    acceptEdit,
    rejectEdit,
  } = useInlineEdit({
    projectId: projectId || "",
    onEditComplete: (suggestion) => {
      console.log("编辑完成:", suggestion);
    },
    onError: (error) => {
      console.error("内联编辑错误:", error);
    },
  });

  const handleGenerateOutline = () => {
    // TODO: 调用 AI 生成章节概要
    console.log("生成章节概要");
  };

  // 处理标题快捷操作
  const handleTitleQuickAction = (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    executeQuickAction(action, selectedText, range, "title");
  };

  // 处理标题自定义编辑
  const handleTitleCustomEdit = (
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    startCustomEdit(selectedText, range, "title");
    // TODO: 打开 AI 助手面板输入自定义指令
  };

  // 处理概要快捷操作
  const handleOutlineQuickAction = (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    executeQuickAction(action, selectedText, range, "outline");
  };

  // 处理概要自定义编辑
  const handleOutlineCustomEdit = (
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    startCustomEdit(selectedText, range, "outline");
    // TODO: 打开 AI 助手面板输入自定义指令
  };

  // 处理接受编辑
  const handleAcceptEdit = (newText: string) => {
    // 根据编辑目标类型更新对应内容
    if (inlineEdit.targetType === "title") {
      setTitle(newText);
    } else if (inlineEdit.targetType === "outline") {
      setOutline(newText);
    }
    acceptEdit();
  };

  // 处理拒绝编辑
  const handleRejectEdit = () => {
    rejectEdit();
  };

  return (
    <div className="space-y-4">
      {/* 章节编号 */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">
          第 {chapterNumber} 章
        </Badge>
      </div>

      {/* 标题输入 - 使用 SimpleTiptapEditor */}
      <SimpleTiptapEditor
        value={title}
        onChange={setTitle}
        targetType="title"
        mode="single-line"
        placeholder="输入章节标题..."
        className="text-2xl font-bold"
        enableInlineEdit={!!projectId}
        onQuickAction={handleTitleQuickAction}
        onOpenCustomEdit={handleTitleCustomEdit}
        onAcceptEdit={handleAcceptEdit}
        onRejectEdit={handleRejectEdit}
      />

      {/* 章节概要（可折叠） */}
      <Collapsible open={isOutlineOpen} onOpenChange={setIsOutlineOpen}>
        <div
          className={cn(
            "rounded-lg border transition-all",
            isOutlineOpen
              ? "border-primary/30 bg-primary/5"
              : "border-border/50 bg-muted/30"
          )}
        >
          <div className="flex w-full items-center justify-between px-4 py-2.5">
            <CollapsibleTrigger asChild>
              <button className="flex flex-1 items-center gap-2 text-left">
                <div
                  className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center",
                    isOutlineOpen ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <FileText
                    className={cn(
                      "h-3.5 w-3.5",
                      isOutlineOpen ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <span className="text-sm font-medium">章节概要</span>
                {outline && (
                  <Badge variant="secondary" className="text-[10px] h-4">
                    已填写
                  </Badge>
                )}
                {isOutlineOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                )}
              </button>
            </CollapsibleTrigger>

            {/* AI 生成按钮 - 移出 CollapsibleTrigger 避免嵌套 button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-primary hover:text-primary ml-2"
              onClick={handleGenerateOutline}
            >
              <Sparkles className="h-3 w-3" />
              AI 生成
            </Button>
          </div>

          <CollapsibleContent>
            <div className="px-4 pb-4">
              {/* 概要输入 - 使用 SimpleTiptapEditor */}
              <SimpleTiptapEditor
                value={outline}
                onChange={setOutline}
                targetType="outline"
                mode="multi-line"
                placeholder="填写本章概要，可辅助 AI 创作..."
                className="min-h-[80px]"
                enableInlineEdit={!!projectId}
                onQuickAction={handleOutlineQuickAction}
                onOpenCustomEdit={handleOutlineCustomEdit}
                onAcceptEdit={handleAcceptEdit}
                onRejectEdit={handleRejectEdit}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                概要将帮助 AI 更准确地理解本章内容方向
              </p>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 分隔线 */}
      <div className="h-px bg-border/50" />
    </div>
  );
}
