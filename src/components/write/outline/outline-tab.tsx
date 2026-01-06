"use client";

import { useState } from "react";
import {
  BookText,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  Target,
  BookMarked,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOutlinesSummary } from "@/hooks/use-outlines";
import { OutlineGenerateDialog } from "./outline-generate-dialog";
import type { NovelOutlineSummary, VolumeOutlineSummary } from "@/types/outline";

interface OutlineTabProps {
  projectId: string;
}

export function OutlineTab({ projectId }: OutlineTabProps) {
  const { data, isLoading, error } = useOutlinesSummary(projectId);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

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

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* 总纲 */}
        {data.novel_outline && (
          <NovelOutlineCard outline={data.novel_outline} />
        )}

        {/* 卷纲列表 */}
        {data.volumes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                分卷大纲
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {data.volume_count}卷
              </Badge>
            </div>
            {data.volumes.map((volume) => (
              <VolumeOutlineItem key={volume.id} volume={volume} />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ============ 子组件 ============

function NovelOutlineCard({ outline }: { outline: NovelOutlineSummary }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-primary/5 transition-colors text-left">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <BookText className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-sm truncate flex-1">
              {outline.title}
            </span>
            {outline.genre && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {outline.genre}
              </Badge>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
            {/* 目标 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>
                目标：{(outline.target_words / 10000).toFixed(0)}万字 /{" "}
                {outline.target_volumes}卷
              </span>
            </div>

            {/* 核心主题 */}
            <div className="text-xs">
              <span className="text-muted-foreground">核心主题：</span>
              <span className="text-foreground">{outline.core_theme}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function VolumeOutlineItem({ volume }: { volume: VolumeOutlineSummary }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/30 bg-card/30 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/5 transition-colors text-left">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm truncate flex-1">{volume.title}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              第{volume.chapter_start}-{volume.chapter_end}章
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-2.5 pt-1 border-t border-border/20">
            <p className="text-xs text-muted-foreground">{volume.volume_goal}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

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
    <div className="p-3 space-y-3">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
