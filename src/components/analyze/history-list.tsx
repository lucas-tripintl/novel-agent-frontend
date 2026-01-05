"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  FileText,
  CheckCircle2,
  Users,
  Earth,
  GitBranch,
  Calendar,
  FileStack,
} from "lucide-react";
import { listProjects } from "@/lib/api/projects";
import { formatTimeAgo } from "@/lib/utils/time";

export function HistoryList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", "completed"],
    queryFn: () => listProjects({ status: "completed", limit: 20 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-destructive/50 mb-4" />
          <p className="text-muted-foreground">加载失败，请刷新重试</p>
        </CardContent>
      </Card>
    );
  }

  const projects = data?.items ?? [];

  if (projects.length === 0) {
    return (
      <Card className="bg-card/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">暂无分析历史</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="bg-card/50 hover:bg-card/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{project.name}</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    已完成
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatTimeAgo(project.updated_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileStack className="h-3.5 w-3.5" />
                    {project.current_chapter} / {project.total_chapters} 章
                  </span>
                </div>
              </div>

              {/* 快捷入口 */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild title="人物图谱">
                  <Link href="/characters">
                    <Users className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild title="世界观">
                  <Link href="/worldview">
                    <Earth className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild title="剧情大纲">
                  <Link href="/storylines">
                    <GitBranch className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${project.id}`}>
                    查看结果
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
