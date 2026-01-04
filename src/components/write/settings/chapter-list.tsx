"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useProjectChapters } from "@/hooks/use-projects";
import { useWritingStore, useEntityEditing, useEditorContent } from "@/stores/writing-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmLeaveDialog } from "../confirm-leave-dialog";
import { cn } from "@/lib/utils";
import {
  FileText,
  CheckCircle2,
  Circle,
  PenLine,
  Plus,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";

type SortOrder = "asc" | "desc";

interface ChapterListProps {
  projectId: string;
}

export function ChapterList({ projectId }: ChapterListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // 默认倒序，最新章节在前

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProjectChapters(projectId, { order: sortOrder });

  const { chapterId, setContext } = useWritingStore();
  const { editingEntity, isEntityDirty, closeEntityEditor } = useEntityEditing();
  const { isDirty: isChapterDirty } = useEditorContent();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 合并所有页的数据
  const chapters = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data?.pages]);

  // 总数
  const totalCount = data?.pages?.[0]?.total ?? 0;

  // 切换排序
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // 无限滚动加载
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 执行章节切换
  const doSwitchChapter = useCallback((targetChapterId: string) => {
    // 先关闭设定编辑器
    if (editingEntity) {
      closeEntityEditor();
    }
    // 然后切换章节
    setContext(projectId, targetChapterId);
  }, [editingEntity, closeEntityEditor, setContext, projectId]);

  const handleSelectChapter = (selectedChapterId: string) => {
    // 如果点击的是当前章节，不做任何操作
    if (selectedChapterId === chapterId && !editingEntity) return;

    // 检查是否有未保存的更改（设定编辑或章节编辑）
    const hasUnsavedChanges = isEntityDirty || (isChapterDirty && !editingEntity);

    if (hasUnsavedChanges) {
      setPendingChapterId(selectedChapterId);
      setShowConfirmDialog(true);
    } else {
      doSwitchChapter(selectedChapterId);
    }
  };

  const handleConfirmDiscard = () => {
    if (pendingChapterId) {
      doSwitchChapter(pendingChapterId);
      setPendingChapterId(null);
    }
  };

  const handleNewChapter = () => {
    // TODO: 创建新章节
    console.log("创建新章节");
  };

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <ConfirmLeaveDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={isEntityDirty ? "设定有未保存的更改" : "章节有未保存的更改"}
        description={isEntityDirty
          ? "当前设定有未保存的更改，确定要放弃并切换章节吗？"
          : "当前章节有未保存的更改，确定要放弃并切换章节吗？"
        }
        onDiscard={handleConfirmDiscard}
      />
      <div className="flex h-full flex-col min-h-0">
        {/* 排序控制栏 */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground">
              共 {totalCount} 章
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={toggleSortOrder}
                >
                  {sortOrder === "desc" ? (
                    <>
                      <ArrowDown className="h-3 w-3" />
                      最新
                    </>
                  ) : (
                    <>
                      <ArrowUp className="h-3 w-3" />
                      最早
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {sortOrder === "desc" ? "当前：最新章节在前" : "当前：最早章节在前"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
          <div className="p-3 space-y-1">
            {chapters.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">暂无章节</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  点击下方按钮创建第一章
                </p>
              </div>
            ) : (
              <>
                {chapters.map((chapter) => {
                  const isActive = chapter.id === chapterId;
                  const isAnalyzed = chapter.analyzed;

                  return (
                    <button
                      key={chapter.id}
                      onClick={() => handleSelectChapter(chapter.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        "hover:bg-muted/50",
                        isActive && "bg-primary/10 border border-primary/30"
                      )}
                    >
                      {/* 状态图标 */}
                      <div className="shrink-0">
                        {isActive ? (
                          <PenLine className="h-4 w-4 text-primary" />
                        ) : isAnalyzed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary/60" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* 章节信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            第 {chapter.chapter_number} 章
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {(chapter.word_count ?? 0).toLocaleString()}字
                          </span>
                          {isActive && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                              编辑中
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate mt-0.5">
                          {chapter.title || "未命名章节"}
                        </p>
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          isActive ? "text-primary" : "text-muted-foreground/40"
                        )}
                      />
                    </button>
                  );
                })}

                {/* 加载更多触发器 */}
                <div ref={loadMoreRef} className="py-2">
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      加载更多...
                    </div>
                  )}
                  {!hasNextPage && chapters.length > 0 && chapters.length >= 20 && (
                    <div className="text-center text-xs text-muted-foreground/60">
                      已加载全部 {totalCount} 章
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* 新建章节按钮 */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={handleNewChapter}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>新建章节</span>
          </Button>
        </div>
      </div>
    </>
  );
}
