"use client";

import { useMemo, useCallback } from "react";
import {
  useWritingStore,
  useChapterOutlineState,
  useStreamingState,
  useInteractiveOutlineState,
  useInteractiveContentState,
  useEditorSettings,
} from "@/stores/writing-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "./tiptap-editor";
import { SimpleTiptapEditor } from "./simple-tiptap-editor";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import { useGenerateChapterSummary } from "@/hooks/use-generate-summary";
import { useTasks } from "@/hooks/use-tasks";
import { useInteractiveOutline } from "@/hooks/use-interactive-outline";
import { useInteractiveChapterWriting } from "@/hooks/use-interactive-chapter-writing";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, BookOpen, AlignLeft, Loader2 } from "lucide-react";
import type { QuickAction } from "@/types/inline-edit";

interface ChapterEditorTabsProps {
  projectId: string;
}

export function ChapterEditorTabs({ projectId }: ChapterEditorTabsProps) {
  const t = useTranslations("write");

  const {
    chapterId,
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

  // 交互式细纲生成状态（决策交互现在在右侧面板处理）
  const { streamingOutline } = useInteractiveOutlineState();

  // 交互式细纲生成 hook（决策交互现在在右侧面板处理）
  const {
    isGenerating: isInteractiveGenerating,
    isWaitingDecision,
  } = useInteractiveOutline(projectId, chapterNumber);

  // 交互式正文生成状态
  const { streamingContentText } = useInteractiveContentState();

  // 编辑器设置（字体等）
  const { settings: editorSettings } = useEditorSettings();

  // 交互式正文生成 hook
  const {
    isGenerating: isContentGenerating,
    isWaitingDecision: isContentWaitingDecision,
    isCompleted: isContentCompleted,
  } = useInteractiveChapterWriting(projectId, chapterNumber);

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

  // 处理生成摘要
  const handleGenerateSummary = useCallback(() => {
    if (!chapterId) return;

    // 检查正文内容是否足够
    if (!content || content.length < 100) {
      alert(t("contentTooShort"));
      return;
    }
    generateSummaryMutation.mutate(
      { chapterId, save: true },
      {
        onSuccess: (data) => {
          setOutline(data.summary);
        },
        onError: (error) => {
          console.error("生成摘要失败:", error);
          alert(t("generateSummaryFailed"));
        },
      }
    );
  }, [chapterId, content, generateSummaryMutation, setOutline, t]);

  // 是否正在生成
  const isGenerating = isStreaming || generateSummaryMutation.isPending;

  // 是否显示生成摘要按钮（仅在摘要 Tab）
  const showGenerateButton = activeEditorTab === "summary";

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
            <span className="whitespace-nowrap">{t("contentTab")}</span>
          </TabsTrigger>
          <TabsTrigger value="outline" className="text-xs px-3 h-6 gap-1.5">
            <FileText className="h-3 w-3" />
            <span className="whitespace-nowrap">{t("outlineTab")}</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs px-3 h-6 gap-1.5">
            <AlignLeft className="h-3 w-3" />
            <span className="whitespace-nowrap">{t("summaryTab")}</span>
          </TabsTrigger>
        </TabsList>

        {showGenerateButton && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-primary hover:text-primary whitespace-nowrap"
            onClick={handleGenerateSummary}
            disabled={isGenerating || !chapterId}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                {t("generateSummary")}
              </>
            )}
          </Button>
        )}
      </div>

      {/* 正文 Tab */}
      <TabsContent value="content" className="flex-1 m-0 mt-0 min-h-0 p-4 flex flex-col">
        {/* 交互式正文生成中（决策交互在右侧面板） */}
        {isContentGenerating || isContentWaitingDecision || isContentCompleted ? (
          <div className="flex-1 flex flex-col">
            {/* 状态栏 */}
            <div className="flex items-center gap-2 mb-3 shrink-0">
              {isContentWaitingDecision ? (
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {t("waitingDecisionArrow")}
                </Badge>
              ) : isContentCompleted ? (
                <Badge variant="outline" className="text-green-600 border-green-500/30 gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {t("generationCompleted") || "生成完成"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-primary border-primary/30 gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("generatingBadge")}
                </Badge>
              )}
            </div>

            {/* 流式正文展示 - 只读 */}
            <SimpleTiptapEditor
              value={streamingContentText || ""}
              onChange={() => {}}
              targetType="content"
              mode="multi-line"
              markdown={true}
              placeholder={t("contentCreating") || "AI 正在创作正文..."}
              className="flex-1 min-h-[300px]"
              enableInlineEdit={false}
              editorSettings={editorSettings}
            />
          </div>
        ) : isChapterWriting ? (
          /* 任务队列写作中（兼容旧方式） */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("aiWriting")}</p>
          </div>
        ) : (
          /* 正常编辑模式 */
          <TiptapEditor
            content={content}
            onChange={setContent}
            isReadOnly={isStreaming}
            placeholder={t("contentPlaceholder")}
            targetType="content"
            enableInlineEdit={!!projectId && !isStreaming}
            onQuickAction={handleContentQuickAction}
            onOpenCustomEdit={handleContentCustomEdit}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
            className="flex-1"
          />
        )}
      </TabsContent>

      {/* 细纲 Tab */}
      <TabsContent value="outline" className="flex-1 m-0 mt-0 min-h-0 p-4 flex flex-col">
        {/* 交互式生成中（决策交互在右侧面板） */}
        {isInteractiveGenerating || isWaitingDecision ? (
          <div className="flex-1 flex flex-col">
            {/* 简化的状态栏 - 详细交互在右侧面板 */}
            <div className="flex items-center gap-2 mb-3 shrink-0">
              {isWaitingDecision ? (
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {t("waitingDecisionArrow")}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-primary border-primary/30 gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("generatingBadge")}
                </Badge>
              )}
            </div>

            {/* 流式内容展示 - 只读 */}
            <SimpleTiptapEditor
              value={streamingOutline || ""}
              onChange={() => {}}
              targetType="novel-outline"
              mode="multi-line"
              markdown={true}
              placeholder={t("outlineCreating")}
              className="flex-1 min-h-[300px]"
              enableInlineEdit={false}
            />
          </div>
        ) : isOutlineGenerating ? (
          /* 任务队列生成中（兼容旧方式） */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("generatingOutline")}</p>
          </div>
        ) : (
          /* 正常编辑模式 */
          <SimpleTiptapEditor
            value={chapterOutline}
            onChange={setChapterOutline}
            targetType="novel-outline"
            mode="multi-line"
            markdown={true}
            placeholder={t("outlinePlaceholder")}
            className="flex-1 min-h-[300px]"
            enableInlineEdit={!!projectId}
            onQuickAction={handleOutlineQuickAction}
            onOpenCustomEdit={handleOutlineCustomEdit}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
          />
        )}
        <p className="mt-3 text-xs text-muted-foreground shrink-0">
          {t("outlineDescription")}
        </p>
      </TabsContent>

      {/* 摘要 Tab */}
      <TabsContent value="summary" className="flex-1 m-0 mt-0 min-h-0 p-4 flex flex-col">
        <SimpleTiptapEditor
          value={outline}
          onChange={setOutline}
          targetType="outline"
          mode="multi-line"
          markdown={true}
          placeholder={t("summaryPlaceholder")}
          className="flex-1 min-h-[150px]"
          enableInlineEdit={!!projectId}
          onQuickAction={handleSummaryQuickAction}
          onOpenCustomEdit={handleSummaryCustomEdit}
          onAcceptEdit={handleAcceptEdit}
          onRejectEdit={handleRejectEdit}
        />
        <p className="mt-3 text-xs text-muted-foreground shrink-0">
          {t("summaryDescription")}
        </p>
      </TabsContent>
    </Tabs>
  );
}
