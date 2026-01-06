"use client";

import { useMemo, useCallback } from "react";
import {
  useWritingStore,
  useChapterOutlineState,
  useStreamingState,
} from "@/stores/writing-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "./tiptap-editor";
import { SimpleTiptapEditor } from "./simple-tiptap-editor";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { useGenerateChapterOutline } from "@/hooks/use-chapter-outline";
import { useStreamWrite } from "@/hooks/use-stream-write";
import { Sparkles, FileText, BookOpen, AlignLeft, Loader2 } from "lucide-react";
import type { QuickAction } from "@/types/inline-edit";

interface ChapterEditorTabsProps {
  projectId: string;
}

export function ChapterEditorTabs({ projectId }: ChapterEditorTabsProps) {
  const {
    chapterId,
    chapterNumber,
    content,
    setContent,
    outline,
    setOutline,
    selectedEntities,
    mode,
  } = useWritingStore();

  const {
    activeEditorTab,
    chapterOutline,
    setActiveEditorTab,
    setChapterOutline,
  } = useChapterOutlineState();

  const { isStreaming } = useStreamingState();

  // 生成细纲 mutation
  const generateOutlineMutation = useGenerateChapterOutline(projectId);

  // 流式写作
  const { startWrite, isStreaming: isWriting } = useStreamWrite({
    onDone: (totalChars) => {
      console.log("写作完成，总字数:", totalChars);
    },
  });

  // 内联编辑 hook（用于摘要）
  const {
    inlineEdit,
    executeQuickAction,
    startCustomEdit,
    acceptEdit,
    rejectEdit,
  } = useInlineEdit({
    projectId,
    onEditComplete: (suggestion) => {
      console.log("摘要编辑完成:", suggestion);
    },
    onError: (error) => {
      console.error("摘要内联编辑错误:", error);
    },
  });

  // 处理摘要快捷操作
  const handleSummaryQuickAction = (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    executeQuickAction(action, selectedText, range, "outline");
  };

  // 处理摘要自定义编辑
  const handleSummaryCustomEdit = (
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    startCustomEdit(selectedText, range, "outline");
  };

  // 处理接受编辑
  const handleAcceptEdit = (newText: string) => {
    if (inlineEdit.targetType === "outline") {
      setOutline(newText);
    }
    acceptEdit();
  };

  // 处理拒绝编辑
  const handleRejectEdit = () => {
    rejectEdit();
  };

  // 生成按钮配置
  const generateConfig = useMemo(
    () => ({
      content: {
        label: "生成正文",
        icon: BookOpen,
      },
      outline: {
        label: "生成细纲",
        icon: FileText,
      },
      summary: {
        label: "生成摘要",
        icon: AlignLeft,
      },
    }),
    []
  );

  // 处理生成
  const handleGenerate = useCallback(() => {
    if (!chapterNumber) return;

    switch (activeEditorTab) {
      case "content":
        // 生成正文
        if (!chapterId) return;
        startWrite({
          projectId,
          chapterId,
          mode,
          entityIds: selectedEntities.map((e) => e.id),
          outline: outline || undefined,
        });
        break;

      case "outline":
        // 生成细纲
        generateOutlineMutation.mutate({
          chapterNumber,
          prompt: undefined,
        });
        break;

      case "summary":
        // 生成摘要 - TODO: 调用 AI Chat
        console.log("生成摘要 - 基于正文内容");
        break;
    }
  }, [
    activeEditorTab,
    chapterNumber,
    chapterId,
    projectId,
    mode,
    selectedEntities,
    outline,
    startWrite,
    generateOutlineMutation,
  ]);

  // 是否正在生成
  const isGenerating =
    isStreaming ||
    isWriting ||
    generateOutlineMutation.isPending;

  const currentConfig = generateConfig[activeEditorTab];

  return (
    <Tabs
      value={activeEditorTab}
      onValueChange={(v) => setActiveEditorTab(v as typeof activeEditorTab)}
      className="flex flex-col h-full"
    >
      {/* Tab 栏 */}
      <div className="flex items-center justify-between border-b border-border/50 px-1 py-1 shrink-0">
        <TabsList className="h-8 bg-muted/50">
          <TabsTrigger value="content" className="text-xs px-3 h-6 gap-1.5">
            <BookOpen className="h-3 w-3" />
            正文
          </TabsTrigger>
          <TabsTrigger value="outline" className="text-xs px-3 h-6 gap-1.5">
            <FileText className="h-3 w-3" />
            细纲
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs px-3 h-6 gap-1.5">
            <AlignLeft className="h-3 w-3" />
            摘要
          </TabsTrigger>
        </TabsList>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-primary hover:text-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !chapterNumber}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              {currentConfig.label}
            </>
          )}
        </Button>
      </div>

      {/* 正文 Tab */}
      <TabsContent value="content" className="flex-1 m-0 mt-0 min-h-0">
        <TiptapEditor
          content={content}
          onChange={setContent}
          isReadOnly={isStreaming}
          placeholder="开始创作你的故事..."
        />
      </TabsContent>

      {/* 细纲 Tab */}
      <TabsContent value="outline" className="flex-1 m-0 mt-0 min-h-0 p-4">
        <SimpleTiptapEditor
          value={chapterOutline}
          onChange={setChapterOutline}
          targetType="outline"
          mode="multi-line"
          markdown={true}
          placeholder={`## 剧情设计
承接上章：...
本章目标：...
关键事件：1. xxx 2. xxx 3. xxx
章末钩子：...

## 情绪与节奏
情绪曲线：开篇xx → 中段xx → 高潮xx → 收尾xx

## 冲突设计
主冲突：...
次冲突：...

## 爽点与伏笔
爽点设计：...
埋设伏笔：...`}
          className="min-h-[300px]"
          enableInlineEdit={!!projectId}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          细纲是写作前的规划文档，包含剧情设计、情绪节奏、冲突设计等。
          支持 Markdown 格式。
        </p>
      </TabsContent>

      {/* 摘要 Tab */}
      <TabsContent value="summary" className="flex-1 m-0 mt-0 min-h-0 p-4">
        <SimpleTiptapEditor
          value={outline}
          onChange={setOutline}
          targetType="outline"
          mode="multi-line"
          placeholder="本章主要内容概述...（建议100字以内）"
          className="min-h-[150px]"
          enableInlineEdit={!!projectId}
          onQuickAction={handleSummaryQuickAction}
          onOpenCustomEdit={handleSummaryCustomEdit}
          onAcceptEdit={handleAcceptEdit}
          onRejectEdit={handleRejectEdit}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          摘要是本章内容的简短描述，用于快速了解章节核心内容。
        </p>
      </TabsContent>
    </Tabs>
  );
}
