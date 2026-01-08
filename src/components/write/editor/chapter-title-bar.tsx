"use client";

import { useWritingStore } from "@/stores/writing-store";
import { Badge } from "@/components/ui/badge";
import { SimpleTiptapEditor } from "./simple-tiptap-editor";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import type { QuickAction } from "@/types/inline-edit";

interface ChapterTitleBarProps {
  chapterNumber: number;
}

export function ChapterTitleBar({ chapterNumber }: ChapterTitleBarProps) {
  const { projectId, title, setTitle } = useWritingStore();

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
