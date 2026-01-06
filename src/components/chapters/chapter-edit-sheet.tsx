"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { useUpdateChapter, useDeleteChapter } from "@/hooks/use-projects";
import type { ChapterRead } from "@/types/api";
import { Loader2, Save, Trash2 } from "lucide-react";

interface ChapterEditSheetProps {
  projectId: string;
  chapter: ChapterRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChapterEditSheet({
  projectId,
  chapter,
  open,
  onOpenChange,
}: ChapterEditSheetProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keepOutline, setKeepOutline] = useState(true);

  const updateMutation = useUpdateChapter(projectId);
  const deleteMutation = useDeleteChapter(projectId);

  // 当 chapter 变化时，重置表单
  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || "");
      setSummary(chapter.summary || "");
    }
  }, [chapter]);

  const handleSave = async () => {
    if (!chapter) return;

    await updateMutation.mutateAsync({
      chapterNumber: chapter.chapter_number,
      data: {
        title: title || undefined,
        summary: summary || undefined,
      },
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!chapter) return;

    await deleteMutation.mutateAsync({
      chapterNumber: chapter.chapter_number,
      keepOutline,
    });
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const isPending = updateMutation.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>编辑章节</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* 章节号 */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">章节号</Label>
              <p className="font-mono text-sm">第 {chapter?.chapter_number} 章</p>
            </div>

            {/* 章节标题 */}
            <div className="space-y-2">
              <Label htmlFor="chapter-title">章节标题</Label>
              <Input
                id="chapter-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入章节标题"
              />
            </div>

            {/* 章节摘要 */}
            <div className="space-y-2">
              <Label htmlFor="chapter-summary">章节摘要</Label>
              <Textarea
                id="chapter-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="输入章节摘要..."
                rows={4}
              />
            </div>

            {/* 字数统计 */}
            {chapter && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">字数</Label>
                <p className="font-mono text-sm">
                  {(chapter.word_count ?? 0).toLocaleString()} 字
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除章节
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              保存
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        targetName={`第 ${chapter?.chapter_number} 章「${chapter?.title || "未命名"}」`}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
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
