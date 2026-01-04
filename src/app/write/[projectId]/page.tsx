"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useProject, useProjectChapters } from "@/hooks/use-projects";
import { useWritingStore } from "@/stores/writing-store";
import { WritingPanel } from "@/components/write/writing-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function WritePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: project, isLoading, error } = useProject(projectId);
  // 默认按 desc 排序，第一个就是最新章节
  const { data: chaptersData } = useProjectChapters(projectId, { order: "desc" });
  const { chapterId, setContext } = useWritingStore();

  // 从 infinite query 结构提取章节列表
  const chapters = useMemo(() => {
    if (!chaptersData?.pages) return [];
    return chaptersData.pages.flatMap((page) => page.items);
  }, [chaptersData?.pages]);

  // 设置当前项目上下文，自动选择最新章节
  useEffect(() => {
    if (projectId && chapters.length > 0) {
      // 如果没有选中章节，自动选择第一个（因为已按 desc 排序，第一个就是最新的）
      if (!chapterId) {
        setContext(projectId, chapters[0].id);
      }
    } else if (projectId && !chapterId) {
      // 没有章节时，只设置项目上下文
      setContext(projectId, null);
    }
  }, [projectId, chapters, chapterId, setContext]);

  if (isLoading) {
    return <WritingPageSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">加载项目失败</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error?.message || "无法找到该项目"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <WritingPanel project={project} />;
}

function WritingPageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* 左栏骨架 */}
      <div className="w-80 border-r border-border/50 p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-24 mt-6" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>

      {/* 中栏骨架 */}
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[60vh] w-full" />
      </div>

      {/* 右栏骨架 */}
      <div className="w-96 border-l border-border/50 p-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-24 mt-6" />
        <Skeleton className="h-[40vh] w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
