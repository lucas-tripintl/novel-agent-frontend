"use client";

import { useState } from "react";
import {
  BookText,
  FileText,
  Sparkles,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Plus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/common/skeleton-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import {
  useOutlinesSummary,
  useNovelOutline,
  useVolumeOutline,
  useDeleteNovelOutline,
  useDeleteVolumeOutline,
} from "@/hooks/use-outlines";
import { useOutlineEditing } from "@/stores/writing-store";
import { OutlineGenerateDialog } from "./outline-generate-dialog";
import { VolumeGenerateDialog } from "./volume-generate-dialog";
import { cn } from "@/lib/utils";
import type { NovelOutlineSummary, VolumeOutlineSummary } from "@/types/outline";

interface OutlineTabProps {
  projectId: string;
}

export function OutlineTab({ projectId }: OutlineTabProps) {
  const { data, isLoading, error } = useOutlinesSummary(projectId);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [volumeDialogOpen, setVolumeDialogOpen] = useState(false);

  if (isLoading) {
    return <OutlineTabSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <BookText className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-destructive">加载大纲失败</p>
        <p className="text-xs text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "请稍后重试"}
        </p>
      </div>
    );
  }

  if (!data?.has_novel_outline) {
    return (
      <>
        <EmptyOutline onGenerate={() => setGenerateDialogOpen(true)} />
        <OutlineGenerateDialog
          projectId={projectId}
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
        />
      </>
    );
  }

  const nextVolumeNumber = (data.volumes.length > 0
    ? Math.max(...data.volumes.map(v => v.volume_number)) + 1
    : 1);

  return (
    <>
      <ScrollArea className="h-full">
        <div className="py-2">
          {/* Novel Outline Row */}
          {data.novel_outline && (
            <NovelOutlineRow
              outline={data.novel_outline}
              projectId={projectId}
            />
          )}

          {/* Volume Outlines Tree */}
          <div className="relative">
            {/* Tree connector line */}
            {(data.volumes.length > 0 || data.has_novel_outline) && (
              <div
                className="absolute left-[19px] top-0 w-px bg-border/60"
                style={{
                  height: data.volumes.length > 0
                    ? `calc(100% - 20px)`
                    : '100%'
                }}
              />
            )}

            {/* Volume rows */}
            {data.volumes.map((volume, index) => (
              <VolumeOutlineRow
                key={volume.id}
                volume={volume}
                projectId={projectId}
                isLast={index === data.volumes.length - 1 && !data.has_novel_outline}
              />
            ))}

            {/* Add Volume Button */}
            {data.has_novel_outline && (
              <div className="relative flex items-center pl-3 pr-2">
                {/* Branch connector */}
                <div className="absolute left-[19px] top-0 h-[50%] w-px bg-border/60" />
                <div className="absolute left-[19px] top-[50%] w-3 h-px bg-border/60" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-5 h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setVolumeDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {data.volumes.length === 0 ? "生成卷纲" : "继续生成卷纲"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Volume Generate Dialog */}
      <VolumeGenerateDialog
        projectId={projectId}
        open={volumeDialogOpen}
        onOpenChange={setVolumeDialogOpen}
        defaultVolumeNumber={nextVolumeNumber}
        maxVolumeNumber={data.novel_outline?.target_volumes ?? 10}
      />
    </>
  );
}

// ============ Row Components ============

function NovelOutlineRow({
  outline,
  projectId
}: {
  outline: NovelOutlineSummary;
  projectId: string;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { setEditingOutline } = useOutlineEditing();
  const { data: fullOutline } = useNovelOutline(projectId);
  const deleteNovelOutlineMutation = useDeleteNovelOutline(projectId);

  const handleOpenOutline = () => {
    if (fullOutline) {
      setEditingOutline({
        type: "novel",
        data: fullOutline,
      });
    }
  };

  const handleDelete = async () => {
    await deleteNovelOutlineMutation.mutateAsync();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="group flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 rounded-md mx-1 transition-colors">
        {/* Icon */}
        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
          <BookText className="h-4 w-4 text-primary" />
        </div>

        {/* Title */}
        <button
          onClick={handleOpenOutline}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          <span className="text-sm font-medium truncate">
            {outline.title}
          </span>
          {outline.genre && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {outline.genre}
            </Badge>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleOpenOutline}
            title="查看详情"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除总纲
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        targetName={`总纲「${outline.title}」`}
        onConfirm={handleDelete}
        isPending={deleteNovelOutlineMutation.isPending}
      />
    </>
  );
}

function VolumeOutlineRow({
  volume,
  projectId,
  isLast = false,
}: {
  volume: VolumeOutlineSummary;
  projectId: string;
  isLast?: boolean;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { setEditingOutline } = useOutlineEditing();
  const { data: fullOutline } = useVolumeOutline(projectId, volume.volume_number);
  const deleteVolumeOutlineMutation = useDeleteVolumeOutline(projectId);

  const handleOpenOutline = () => {
    if (fullOutline) {
      setEditingOutline({
        type: "volume",
        data: fullOutline,
      });
    }
  };

  const handleDelete = async () => {
    await deleteVolumeOutlineMutation.mutateAsync(volume.volume_number);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="relative group flex items-center gap-1 pl-3 pr-2 py-1.5 hover:bg-muted/50 rounded-md mx-1 transition-colors">
        {/* Tree branch connector */}
        <div className={cn(
          "absolute left-[19px] w-3 h-px bg-border/60",
          isLast ? "top-[50%]" : "top-[50%]"
        )} />

        {/* Icon with indent */}
        <div className="shrink-0 w-5 h-5 flex items-center justify-center ml-3">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Title */}
        <button
          onClick={handleOpenOutline}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            第{volume.volume_number}卷
          </span>
          <span className="text-sm truncate">
            {volume.title}
          </span>
          <span className="text-[10px] text-muted-foreground/70 shrink-0 hidden sm:inline">
            {volume.chapter_start}-{volume.chapter_end}章
          </span>
        </button>

        {/* Actions */}
        <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleOpenOutline}
            title="查看详情"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除卷纲
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        targetName={`卷纲「${volume.title}」`}
        onConfirm={handleDelete}
        isPending={deleteVolumeOutlineMutation.isPending}
      />
    </>
  );
}

// ============ Empty & Skeleton ============

function EmptyOutline({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm font-medium">尚未创建大纲</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        描述你的创作想法，AI 将生成总纲
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 gap-1.5"
        onClick={onGenerate}
      >
        <Sparkles className="h-3.5 w-3.5" />
        生成大纲
      </Button>
    </div>
  );
}

function OutlineTabSkeleton() {
  return (
    <SkeletonList count={4} itemHeight={32} />
  );
}
