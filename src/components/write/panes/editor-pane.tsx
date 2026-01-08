"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useWritingStore,
  useStreamingState,
  useEntityEditing,
  useOutlineEditing,
  useChapterOutlineState,
  useEditorContent,
} from "@/stores/writing-store";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useChapter } from "@/hooks/use-projects";
import { useChapterOutline } from "@/hooks/use-chapter-outline";
import { useChapterSave } from "@/hooks/use-chapter-save";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorStatusBar } from "../editor/editor-status-bar";
import { ChapterTitleBar } from "../editor/chapter-title-bar";
import { ChapterEditorTabs } from "../editor/chapter-editor-tabs";
import { EntityEditor } from "../editor/entity-editor";
import { OutlineEditor } from "../editor/outline-editor";
import { cn } from "@/lib/utils";
import { FileText, Sparkles, Loader2 } from "lucide-react";

interface EditorPaneProps {
  projectId: string;
}

export function EditorPane({ projectId }: EditorPaneProps) {
  const t = useTranslations("write");
  const { chapterId, chapterNumber, title, loadDraft } = useWritingStore();
  const { isStreaming } = useStreamingState();
  const { editingEntity } = useEntityEditing();
  const { editingOutline } = useOutlineEditing();
  const { loadChapterOutline, isChapterOutlineDirty } = useChapterOutlineState();
  const { isDirty } = useEditorContent();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 章节保存 hook
  const chapterSave = useChapterSave(projectId);

  // 浏览器关闭/刷新时提示未保存更改
  const hasUnsavedChanges = isDirty || isChapterOutlineDirty;
  useUnsavedChangesWarning(hasUnsavedChanges);

  // 跟踪章节切换的过渡状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevChapterIdRef = useRef<string | null>(null);

  // 使用章节详情 API 获取完整内容
  const { data: chapterDetail, isFetching: isChapterFetching } = useChapter(projectId, chapterNumber ?? 0, {
    enabled: !!chapterId && !!chapterNumber && chapterNumber > 0,
  });

  // 检测章节切换，触发过渡状态
  useEffect(() => {
    if (chapterId && chapterId !== prevChapterIdRef.current) {
      setIsTransitioning(true);
      prevChapterIdRef.current = chapterId;
    }
  }, [chapterId]);

  // 数据加载完成后，延迟一小段时间再结束过渡（让动画更平滑）
  useEffect(() => {
    if (chapterDetail && isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 150);
      return () => clearTimeout(timer);
    }
  }, [chapterDetail, isTransitioning]);

  // 判断是否正在加载章节内容
  const isLoadingContent = isTransitioning || (isChapterFetching && !chapterDetail);

  // 使用章节细纲 API
  const { data: chapterOutlineData } = useChapterOutline(
    projectId,
    chapterNumber
  );

  // 加载章节内容
  useEffect(() => {
    if (chapterDetail) {
      loadDraft({
        title: chapterDetail.title || "",
        outline: chapterDetail.summary || "",
        content: chapterDetail.content || "",
      });
    }
  }, [chapterDetail, loadDraft]);

  // 加载细纲内容
  useEffect(() => {
    const queryKeyStr = JSON.stringify(["chapterOutlines", "detail", projectId, chapterNumber]);
    console.log("[EditorPane] 细纲数据变化:", {
      projectId,
      chapterNumber,
      hasData: !!chapterOutlineData,
      content: chapterOutlineData?.content?.slice(0, 100),
      queryKeyStr,
    });
    if (chapterOutlineData) {
      console.log("[EditorPane] 加载细纲内容到 store:", chapterOutlineData.content?.slice(0, 100));
      loadChapterOutline(chapterOutlineData.content || "");
    }
  }, [chapterOutlineData, chapterNumber, projectId, loadChapterOutline]);

  // 切换章节时重置滚动位置
  useEffect(() => {
    if (chapterId && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [chapterId]);

  // 大纲编辑模式
  if (editingOutline) {
    return <OutlineEditor outline={editingOutline} projectId={projectId} />;
  }

  // 设定编辑模式
  if (editingEntity) {
    return <EntityEditor entity={editingEntity} projectId={projectId} />;
  }

  // 空状态
  if (!chapterId) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("selectChapter")}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("selectChapterHint")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background min-h-0">
      {/* 章节状态栏 */}
      <EditorStatusBar
        title={t("chapterNumber", { number: chapterNumber || 1 })}
        subtitle={isLoadingContent ? t("loading") : (title || t("untitledChapter"))}
        icon={isLoadingContent ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <FileText className="h-5 w-5 text-primary" />
        )}
        isDirty={chapterSave.isDirty}
        saveStatus={chapterSave.saveStatus}
        onSave={chapterSave.save}
        disabled={isStreaming || isLoadingContent}
      />

      {/* 流式写作指示器 */}
      {isStreaming && (
        <div className="flex items-center gap-2 px-6 py-2 bg-primary/5 border-b border-primary/20 shrink-0">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm text-primary">{t("aiWriting")}</span>
          <div className="flex-1" />
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="w-full px-6 py-6">
          {/* 章节标题栏 */}
          <ChapterTitleBar chapterNumber={chapterNumber || 1} />

          {/* 章节编辑器 Tabs - 带过渡动画 */}
          <div className="mt-4 relative">
            {/* 加载骨架屏 */}
            <div
              className={cn(
                "absolute inset-0 z-10 transition-all duration-200",
                isLoadingContent
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              )}
            >
              <EditorSkeleton />
            </div>

            {/* 实际内容 - 淡入效果 */}
            <div
              className={cn(
                "transition-opacity duration-200",
                isLoadingContent ? "opacity-0" : "opacity-100"
              )}
            >
              <ChapterEditorTabs projectId={projectId} />
            </div>
          </div>

          {/* 底部留白 */}
          <div className="h-[20vh]" />
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * 编辑器骨架屏组件 - 模拟编辑器加载状态
 */
function EditorSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Tab 栏骨架 */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>

      {/* 内容区骨架 - 模拟文本行 */}
      <div className="space-y-3 pt-2">
        {/* 段落骨架 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[88%]" />
        </div>

        <div className="h-4" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[78%]" />
        </div>

        <div className="h-4" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[96%]" />
          <Skeleton className="h-4 w-[82%]" />
        </div>
      </div>
    </div>
  );
}
