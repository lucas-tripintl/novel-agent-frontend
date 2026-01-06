"use client";

import { useEffect, useRef } from "react";
import {
  useWritingStore,
  useStreamingState,
  useEntityEditing,
  useOutlineEditing,
  useChapterOutlineState,
} from "@/stores/writing-store";
import { useChapter } from "@/hooks/use-projects";
import { useChapterOutline } from "@/hooks/use-chapter-outline";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChapterTitleBar } from "../editor/chapter-title-bar";
import { ChapterEditorTabs } from "../editor/chapter-editor-tabs";
import { EntityEditor } from "../editor/entity-editor";
import { OutlineEditor } from "../editor/outline-editor";
import { FileText, Sparkles } from "lucide-react";

interface EditorPaneProps {
  projectId: string;
}

export function EditorPane({ projectId }: EditorPaneProps) {
  const { chapterId, chapterNumber, loadDraft } = useWritingStore();
  const { isStreaming } = useStreamingState();
  const { editingEntity } = useEntityEditing();
  const { editingOutline } = useOutlineEditing();
  const { loadChapterOutline } = useChapterOutlineState();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 使用章节详情 API 获取完整内容
  const { data: chapterDetail } = useChapter(projectId, chapterNumber ?? 0, {
    enabled: !!chapterId && !!chapterNumber && chapterNumber > 0,
  });

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
    if (chapterOutlineData) {
      loadChapterOutline(chapterOutlineData.content || "");
    }
  }, [chapterOutlineData, loadChapterOutline]);

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
            <h2 className="text-lg font-semibold">选择一个章节开始创作</h2>
            <p className="text-sm text-muted-foreground mt-1">
              从左侧章节列表中选择要编辑的章节，或创建新章节
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background min-h-0">
      {/* 流式写作指示器 */}
      {isStreaming && (
        <div className="flex items-center gap-2 px-6 py-2 bg-primary/5 border-b border-primary/20">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm text-primary">AI 正在创作中...</span>
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
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* 章节标题栏 */}
          <ChapterTitleBar chapterNumber={chapterNumber || 1} />

          {/* 章节编辑器 Tabs */}
          <div className="mt-4">
            <ChapterEditorTabs projectId={projectId} />
          </div>

          {/* 底部留白 */}
          <div className="h-[20vh]" />
        </div>
      </ScrollArea>
    </div>
  );
}
