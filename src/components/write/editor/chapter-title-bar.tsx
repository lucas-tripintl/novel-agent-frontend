"use client";

import { useState, useCallback } from "react";
import { useWritingStore, useChapterSaveState } from "@/stores/writing-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SimpleTiptapEditor } from "./simple-tiptap-editor";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { saveChapter } from "@/lib/api/writing";
import { upsertChapterOutline } from "@/lib/api/chapter-outlines";
import { Cloud, CloudOff, Save, Loader2 } from "lucide-react";
import type { QuickAction } from "@/types/inline-edit";

interface ChapterTitleBarProps {
  chapterNumber: number;
}

export function ChapterTitleBar({ chapterNumber }: ChapterTitleBarProps) {
  const { projectId, title, setTitle } = useWritingStore();
  const [isSaving, setIsSaving] = useState(false);

  // 获取保存状态
  const {
    chapterId,
    outline,
    content,
    chapterOutline,
    isDirty,
    isChapterOutlineDirty,
    markAsSaved,
    markChapterOutlineSaved,
  } = useChapterSaveState();

  // 是否有未保存的更改
  const hasUnsavedChanges = isDirty || isChapterOutlineDirty;

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
      console.log("标题编辑完成:", suggestion);
    },
    onError: (error) => {
      console.error("标题内联编辑错误:", error);
    },
  });

  // 保存处理
  const handleSave = useCallback(async () => {
    if (!projectId || !chapterId || !chapterNumber) return;
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      const tasks: Promise<unknown>[] = [];

      // 1. 正文/摘要（共用一个 API）
      if (isDirty) {
        tasks.push(
          saveChapter({
            projectId,
            chapterId,
            title,
            outline,
            content,
          }).then(() => markAsSaved())
        );
      }

      // 2. 细纲（独立 API）
      if (isChapterOutlineDirty) {
        tasks.push(
          upsertChapterOutline(projectId, chapterNumber, {
            content: chapterOutline,
          }).then(() => markChapterOutlineSaved())
        );
      }

      await Promise.all(tasks);
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    projectId,
    chapterId,
    chapterNumber,
    hasUnsavedChanges,
    isDirty,
    isChapterOutlineDirty,
    title,
    outline,
    content,
    chapterOutline,
    markAsSaved,
    markChapterOutlineSaved,
  ]);

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
  };

  // 处理接受编辑
  const handleAcceptEdit = (newText: string) => {
    if (inlineEdit.targetType === "title") {
      setTitle(newText);
    }
    acceptEdit();
  };

  // 处理拒绝编辑
  const handleRejectEdit = () => {
    rejectEdit();
  };

  return (
    <div className="space-y-3">
      {/* 章节编号 + 保存状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs">
            第 {chapterNumber} 章
          </Badge>

          {/* 保存状态 */}
          <div className="flex items-center gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">保存中...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <CloudOff className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs text-amber-500">未保存</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-6 px-2"
                      onClick={handleSave}
                    >
                      <Save className="h-3 w-3" />
                      <span className="text-xs">保存</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    保存
                    {isDirty && isChapterOutlineDirty
                      ? "正文、摘要和细纲"
                      : isDirty
                        ? "正文和摘要"
                        : "细纲"}
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Cloud className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-xs text-muted-foreground">已保存</span>
              </>
            )}
          </div>
        </div>
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
    </div>
  );
}
