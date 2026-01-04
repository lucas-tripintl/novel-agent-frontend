"use client";

import { useMemo } from "react";
import { useProjectChapters } from "@/hooks/use-projects";
import { useWritingStore } from "@/stores/writing-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  FileText,
  CheckCircle2,
  Circle,
  PenLine,
  Plus,
  ChevronRight,
} from "lucide-react";

interface ChapterListProps {
  projectId: string;
}

export function ChapterList({ projectId }: ChapterListProps) {
  const { data: chaptersData, isLoading } = useProjectChapters(projectId);
  const { chapterId, setContext } = useWritingStore();

  const chapters = chaptersData?.items ?? [];

  const handleSelectChapter = (selectedChapterId: string) => {
    setContext(projectId, selectedChapterId);
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
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
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
            chapters.map((chapter) => {
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
            })
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
  );
}
