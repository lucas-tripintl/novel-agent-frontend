"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef, memo, startTransition } from "react";
import { useProjectChapters, useDeleteChapter, useCreateChapter } from "@/hooks/use-projects";
import { useWritingStore, useEntityEditing, useEditorContent, useOutlineEditing, useChapterOutlineState, useChapterSaveState } from "@/stores/writing-store";
import { updateChapter } from "@/lib/api/projects";
import { upsertChapterOutline } from "@/lib/api/chapter-outlines";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmLeaveDialog } from "../confirm-leave-dialog";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { ChapterEditSheet } from "@/components/chapters/chapter-edit-sheet";
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
  MoreHorizontal,
  Settings,
  Trash2,
} from "lucide-react";
import type { ChapterRead } from "@/types/api";

type SortOrder = "asc" | "desc";

interface ChapterListProps {
  projectId: string;
}

// ============ ChapterListItem - memoized 章节列表项 ============
interface ChapterListItemProps {
  chapter: ChapterRead;
  isActive: boolean;
  isSwitchingTo: boolean;
  onSelect: (chapterId: string, chapterNumber: number) => void;
  onEdit: (chapter: ChapterRead) => void;
  onDelete: (chapter: ChapterRead) => void;
}

const ChapterListItem = memo(
  function ChapterListItem({
    chapter,
    isActive,
    isSwitchingTo,
    onSelect,
    onEdit,
    onDelete,
  }: ChapterListItemProps) {
    const isAnalyzed = chapter.analyzed;

    return (
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg transition-all duration-150 group",
          "hover:bg-muted/50",
          isSwitchingTo && "bg-primary/5 border border-primary/20 scale-[0.99]",
          isActive && !isSwitchingTo && "bg-primary/10 border border-primary/30"
        )}
      >
        <button
          onClick={() => onSelect(chapter.id, chapter.chapter_number)}
          className={cn(
            "flex-1 flex items-center gap-3 px-3 py-2.5 text-left",
            "transition-transform duration-100 active:scale-[0.98]"
          )}
          disabled={isSwitchingTo}
        >
          <div className="shrink-0">
            {isSwitchingTo ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : isActive ? (
              <PenLine className="h-4 w-4 text-primary" />
            ) : isAnalyzed ? (
              <CheckCircle2 className="h-4 w-4 text-primary/60" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                第 {chapter.chapter_number} 章
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {(chapter.word_count ?? 0).toLocaleString()}字
              </span>
              {isActive && !isSwitchingTo && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  编辑中
                </Badge>
              )}
              {isSwitchingTo && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-primary border-primary/30">
                  切换中
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium truncate mt-0.5">
              {chapter.title || "未命名章节"}
            </p>
          </div>

          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 transition-all duration-150",
              isSwitchingTo ? "text-primary translate-x-0.5" : isActive ? "text-primary" : "text-muted-foreground/40"
            )}
          />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 mr-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(chapter)}>
              <Settings className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(chapter)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  // 自定义比较函数：检查所有影响渲染的 props
  // 由于 onSelect/onEdit/onDelete 现在使用 useCallback 稳定化，它们的引用稳定
  (prev, next) =>
    prev.chapter.id === next.chapter.id &&
    prev.chapter.title === next.chapter.title &&
    prev.chapter.word_count === next.chapter.word_count &&
    prev.chapter.analyzed === next.chapter.analyzed &&
    prev.isActive === next.isActive &&
    prev.isSwitchingTo === next.isSwitchingTo &&
    prev.onSelect === next.onSelect &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete
);

export function ChapterList({ projectId }: ChapterListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // 默认倒序，最新章节在前
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [chapterToEdit, setChapterToEdit] = useState<ChapterRead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<ChapterRead | null>(null);
  const [keepOutline, setKeepOutline] = useState(true);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProjectChapters(projectId, { order: sortOrder });
  const deleteChapterMutation = useDeleteChapter(projectId);
  const createChapterMutation = useCreateChapter(projectId);

  const { chapterId, setContext, setChapterContext } = useWritingStore();
  const { editingEntity, isEntityDirty, closeEntityEditor } = useEntityEditing();
  const { editingOutline, closeOutlineEditor } = useOutlineEditing();
  const { isDirty: isChapterDirty } = useEditorContent();
  const { isChapterOutlineDirty } = useChapterOutlineState();

  // 保存状态
  const {
    projectId: currentProjectId,
    chapterId: currentChapterId,
    chapterNumber: currentChapterNumber,
    title: currentTitle,
    outline: currentOutline,
    content: currentContent,
    chapterOutline: currentChapterOutline,
    isDirty,
    markAsSaved,
    markChapterOutlineSaved,
  } = useChapterSaveState();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // 追踪正在切换到的章节，用于显示加载状态
  const [switchingToChapterId, setSwitchingToChapterId] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 使用 ref 存储最新状态，避免 memo 子组件使用陈旧的闭包
  const stateRef = useRef({
    chapterId,
    editingEntity,
    editingOutline,
    isEntityDirty,
    isChapterDirty,
    isChapterOutlineDirty,
  });

  // 保持 ref 与最新状态同步
  useEffect(() => {
    stateRef.current = {
      chapterId,
      editingEntity,
      editingOutline,
      isEntityDirty,
      isChapterDirty,
      isChapterOutlineDirty,
    };
  });

  // 编辑/删除处理 - 使用 useCallback 稳定化回调
  const handleEditClick = useCallback((chapter: ChapterRead) => {
    setChapterToEdit(chapter);
    setEditSheetOpen(true);
  }, []);

  const handleDeleteClick = useCallback((chapter: ChapterRead) => {
    setChapterToDelete(chapter);
    setKeepOutline(true);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (chapterToDelete) {
      await deleteChapterMutation.mutateAsync({
        chapterNumber: chapterToDelete.chapter_number,
        keepOutline,
      });
      setDeleteDialogOpen(false);
      setChapterToDelete(null);
    }
  };

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
  const doSwitchChapter = useCallback((targetChapterId: string, targetChapterNumber: number) => {
    // 设置正在切换的章节ID（用于即时视觉反馈）- 这是紧急更新
    setSwitchingToChapterId(targetChapterId);

    // 使用 startTransition 将非紧急更新标记为低优先级，避免阻塞 UI
    startTransition(() => {
      // 先关闭设定编辑器
      if (stateRef.current.editingEntity) {
        closeEntityEditor();
      }
      // 关闭大纲编辑器
      if (stateRef.current.editingOutline) {
        closeOutlineEditor();
      }
      // 使用轻量级的章节切换
      setChapterContext(targetChapterId, targetChapterNumber);
    });

    // 切换完成后清除加载状态（使用 requestAnimationFrame 让动画更平滑）
    requestAnimationFrame(() => {
      setTimeout(() => setSwitchingToChapterId(null), 150);
    });
  }, [closeEntityEditor, closeOutlineEditor, setChapterContext]);

  const [pendingChapterNumber, setPendingChapterNumber] = useState<number | null>(null);

  // 使用 useCallback 稳定化回调，从 ref 读取最新状态避免陈旧闭包问题
  const handleSelectChapter = useCallback((selectedChapterId: string, selectedChapterNumber: number) => {
    // 从 ref 读取最新状态
    const {
      chapterId: currentChapterId,
      editingEntity: currentEditingEntity,
      editingOutline: currentEditingOutline,
      isEntityDirty: currentIsEntityDirty,
      isChapterDirty: currentIsChapterDirty,
      isChapterOutlineDirty: currentIsChapterOutlineDirty,
    } = stateRef.current;

    // 如果点击的是当前章节，且不在设定/大纲编辑模式，不做任何操作
    if (selectedChapterId === currentChapterId && !currentEditingEntity && !currentEditingOutline) return;

    // 检查是否有未保存的更改（设定编辑、章节编辑或细纲编辑）
    const hasUnsavedChanges = currentIsEntityDirty || ((currentIsChapterDirty || currentIsChapterOutlineDirty) && !currentEditingEntity);

    if (hasUnsavedChanges) {
      setPendingChapterId(selectedChapterId);
      setPendingChapterNumber(selectedChapterNumber);
      setShowConfirmDialog(true);
    } else {
      doSwitchChapter(selectedChapterId, selectedChapterNumber);
    }
  }, [doSwitchChapter]);

  // 保存当前章节并切换
  const handleSaveAndSwitch = async () => {
    if (!currentProjectId || !currentChapterId || !currentChapterNumber) {
      // 如果没有当前章节，直接切换
      if (pendingChapterId && pendingChapterNumber !== null) {
        doSwitchChapter(pendingChapterId, pendingChapterNumber);
        setPendingChapterId(null);
        setPendingChapterNumber(null);
      }
      return;
    }

    setIsSaving(true);
    try {
      const tasks: Promise<unknown>[] = [];

      // 保存正文/摘要
      if (isDirty) {
        tasks.push(
          updateChapter(currentProjectId, currentChapterNumber, {
            title: currentTitle,
            summary: currentOutline,
            content: currentContent,
          }).then(() => markAsSaved())
        );
      }

      // 保存细纲
      if (isChapterOutlineDirty) {
        tasks.push(
          upsertChapterOutline(currentProjectId, currentChapterNumber, {
            content: currentChapterOutline,
          }).then(() => markChapterOutlineSaved())
        );
      }

      await Promise.all(tasks);

      // 保存成功后切换章节
      if (pendingChapterId && pendingChapterNumber !== null) {
        doSwitchChapter(pendingChapterId, pendingChapterNumber);
        setPendingChapterId(null);
        setPendingChapterNumber(null);
      }
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDiscard = () => {
    if (pendingChapterId && pendingChapterNumber !== null) {
      doSwitchChapter(pendingChapterId, pendingChapterNumber);
      setPendingChapterId(null);
      setPendingChapterNumber(null);
    }
  };

  const handleNewChapter = async () => {
    // 计算下一个章节号：找到当前最大章节号 + 1
    const maxChapterNumber = chapters.reduce(
      (max, ch) => Math.max(max, ch.chapter_number),
      0
    );
    const nextChapterNumber = maxChapterNumber + 1;

    try {
      const newChapter = await createChapterMutation.mutateAsync({
        chapter_number: nextChapterNumber,
        title: `第${nextChapterNumber}章`,
      });
      // 创建成功后自动选中新章节
      setContext(projectId, newChapter.id, newChapter.chapter_number);
    } catch {
      // 错误由 React Query 处理，这里不需要额外处理
    }
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
        description={
          isEntityDirty
            ? "当前设定有未保存的更改，确定要放弃并切换章节吗？"
            : isChapterDirty && isChapterOutlineDirty
              ? "当前章节的正文、摘要和细纲有未保存的更改，是否保存后再切换？"
              : isChapterOutlineDirty
                ? "当前章节的细纲有未保存的更改，是否保存后再切换？"
                : "当前章节的正文或摘要有未保存的更改，是否保存后再切换？"
        }
        onSave={isEntityDirty ? undefined : handleSaveAndSwitch}
        onDiscard={handleConfirmDiscard}
        isSaving={isSaving}
      />
      <div className="flex h-full flex-col min-h-0">
        {/* 新建章节按钮 */}
        <div className="p-3 border-b border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={handleNewChapter}
            disabled={createChapterMutation.isPending}
          >
            {createChapterMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>{createChapterMutation.isPending ? "创建中..." : "新建章节"}</span>
          </Button>
        </div>

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
                {chapters.map((chapter) => (
                  <ChapterListItem
                    key={chapter.id}
                    chapter={chapter}
                    isActive={chapter.id === chapterId}
                    isSwitchingTo={chapter.id === switchingToChapterId}
                    onSelect={handleSelectChapter}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}

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
      </div>

      {/* 章节编辑面板 */}
      <ChapterEditSheet
        projectId={projectId}
        chapter={chapterToEdit}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        targetName={chapterToDelete ? `第 ${chapterToDelete.chapter_number} 章「${chapterToDelete.title || "未命名"}」` : ""}
        onConfirm={handleDeleteConfirm}
        isPending={deleteChapterMutation.isPending}
      >
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="keep-outline"
            checked={keepOutline}
            onCheckedChange={(checked) => setKeepOutline(checked === true)}
          />
          <label
            htmlFor="keep-outline"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            保留章节细纲
          </label>
        </div>
      </ConfirmDeleteDialog>
    </>
  );
}
