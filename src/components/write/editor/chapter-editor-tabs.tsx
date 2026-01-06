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
import { useGenerateChapterSummary } from "@/hooks/use-generate-summary";
import { useTasks } from "@/hooks/use-tasks";
import { Sparkles, FileText, BookOpen, AlignLeft, Loader2 } from "lucide-react";
import type { QuickAction } from "@/types/inline-edit";

interface ChapterEditorTabsProps {
  projectId: string;
}

export function ChapterEditorTabs({ projectId }: ChapterEditorTabsProps) {
  const {
    chapterNumber,
    content,
    setContent,
    outline,
    setOutline,
  } = useWritingStore();

  const {
    activeEditorTab,
    chapterOutline,
    setActiveEditorTab,
    setChapterOutline,
  } = useChapterOutlineState();

  const { isStreaming } = useStreamingState();

  // 获取当前项目的任务列表
  const { data: tasksData } = useTasks(projectId);

  // 检查是否有正在进行的细纲生成任务
  const isOutlineGenerating = useMemo(() => {
    if (!tasksData?.items || !chapterNumber) return false;
    return tasksData.items.some(
      (task) =>
        task.job_type === "generate_chapter_outline" &&
        (task.status === "queued" || task.status === "running") &&
        task.meta?.chapter_number === chapterNumber
    );
  }, [tasksData?.items, chapterNumber]);

  // 检查是否有正在进行的章节写作任务
  const isChapterWriting = useMemo(() => {
    if (!tasksData?.items || !chapterNumber) return false;
    return tasksData.items.some(
      (task) =>
        task.job_type === "write_chapter" &&
        (task.status === "queued" || task.status === "running") &&
        task.meta?.chapter_number === chapterNumber
    );
  }, [tasksData?.items, chapterNumber]);

  // 生成细纲 mutation
  const generateOutlineMutation = useGenerateChapterOutline(projectId);

  // 生成摘要 mutation
  const generateSummaryMutation = useGenerateChapterSummary();

  // 内联编辑 hook
  const {
    executeQuickAction,
    startCustomEdit,
    acceptEdit,
    rejectEdit,
  } = useInlineEdit({
    projectId,
    onEditComplete: (suggestion) => {
      console.log("内联编辑完成:", suggestion);
    },
    onError: (error) => {
      console.error("内联编辑错误:", error);
    },
  });

  // ========== 正文内联编辑 ==========
  const handleContentQuickAction = (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    executeQuickAction(action, selectedText, range, "content");
  };

  const handleContentCustomEdit = (
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    startCustomEdit(selectedText, range, "content");
  };

  // ========== 细纲内联编辑 ==========
  const handleOutlineQuickAction = (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    executeQuickAction(action, selectedText, range, "novel-outline");
  };

  const handleOutlineCustomEdit = (
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    startCustomEdit(selectedText, range, "novel-outline");
  };

  // ========== 摘要内联编辑 ==========
  const handleSummaryQuickAction = (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    executeQuickAction(action, selectedText, range, "outline");
  };

  const handleSummaryCustomEdit = (
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    startCustomEdit(selectedText, range, "outline");
  };

  // ========== 通用编辑处理 ==========
  const handleAcceptEdit = () => {
    // 内容通过 editor 的 onUpdate 自动更新，这里只需清理状态
    acceptEdit();
  };

  const handleRejectEdit = () => {
    rejectEdit();
  };

  // 生成按钮配置（仅细纲和摘要，正文通过工具栏的"开始书写"生成）
  const generateConfig = useMemo(
    () => ({
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

  // 处理生成（仅细纲和摘要）
  const handleGenerate = useCallback(() => {
    if (!chapterNumber) return;

    switch (activeEditorTab) {
      case "outline":
        // 生成细纲
        generateOutlineMutation.mutate({
          chapterNumber,
          prompt: undefined,
        });
        break;

      case "summary":
        // 生成摘要 - 基于正文内容
        if (!content || content.length < 100) {
          alert("正文内容不足 100 字，无法生成摘要");
          return;
        }
        generateSummaryMutation.mutate(content, {
          onSuccess: (data) => {
            setOutline(data.summary);
          },
          onError: (error) => {
            console.error("生成摘要失败:", error);
            alert("生成摘要失败，请稍后重试");
          },
        });
        break;
    }
  }, [
    activeEditorTab,
    chapterNumber,
    content,
    generateOutlineMutation,
    generateSummaryMutation,
    setOutline,
  ]);

  // 是否正在生成
  const isGenerating =
    isStreaming ||
    generateOutlineMutation.isPending ||
    generateSummaryMutation.isPending;

  // 当前 tab 的生成配置（content tab 没有生成按钮）
  const currentConfig = activeEditorTab !== "content"
    ? generateConfig[activeEditorTab]
    : null;

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

        {currentConfig && (
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
        )}
      </div>

      {/* 正文 Tab */}
      <TabsContent value="content" className="flex-1 m-0 mt-0 min-h-0">
        {isChapterWriting ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI 正在创作中...</p>
          </div>
        ) : (
          <TiptapEditor
            content={content}
            onChange={setContent}
            isReadOnly={isStreaming}
            placeholder="开始创作你的故事..."
            targetType="content"
            enableInlineEdit={!!projectId && !isStreaming}
            onQuickAction={handleContentQuickAction}
            onOpenCustomEdit={handleContentCustomEdit}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
          />
        )}
      </TabsContent>

      {/* 细纲 Tab */}
      <TabsContent value="outline" className="flex-1 m-0 mt-0 min-h-0 p-4 flex flex-col">
        {isOutlineGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">正在生成细纲...</p>
          </div>
        ) : (
          <SimpleTiptapEditor
            value={chapterOutline}
            onChange={setChapterOutline}
            targetType="novel-outline"
            mode="multi-line"
            markdown={true}
            placeholder="输入章节细纲：剧情设计、情绪节奏、冲突设计、爽点伏笔..."
            className="flex-1 min-h-[300px]"
            enableInlineEdit={!!projectId}
            onQuickAction={handleOutlineQuickAction}
            onOpenCustomEdit={handleOutlineCustomEdit}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
          />
        )}
        <p className="mt-3 text-xs text-muted-foreground shrink-0">
          细纲是写作前的规划文档，包含剧情设计、情绪节奏、冲突设计等。
          支持 Markdown 格式。点击「生成细纲」可 AI 自动生成。
        </p>
      </TabsContent>

      {/* 摘要 Tab */}
      <TabsContent value="summary" className="flex-1 m-0 mt-0 min-h-0 p-4 flex flex-col">
        <SimpleTiptapEditor
          value={outline}
          onChange={setOutline}
          targetType="outline"
          mode="multi-line"
          placeholder="本章主要内容概述...（建议100字以内）"
          className="flex-1 min-h-[150px]"
          enableInlineEdit={!!projectId}
          onQuickAction={handleSummaryQuickAction}
          onOpenCustomEdit={handleSummaryCustomEdit}
          onAcceptEdit={handleAcceptEdit}
          onRejectEdit={handleRejectEdit}
        />
        <p className="mt-3 text-xs text-muted-foreground shrink-0">
          摘要是本章内容的简短描述，用于快速了解章节核心内容。
        </p>
      </TabsContent>
    </Tabs>
  );
}
