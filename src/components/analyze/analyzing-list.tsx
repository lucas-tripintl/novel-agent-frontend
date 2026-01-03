"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  CheckCircle,
  Loader2,
  X,
  Clock,
} from "lucide-react";
import { useActiveTasks } from "@/hooks/use-task-polling";
import { cancelTask } from "@/lib/api/tasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function AnalyzingList() {
  const { data: tasks = [], isLoading, error } = useActiveTasks();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: cancelTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-48" />
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
          <X className="h-12 w-12 text-destructive/50 mb-4" />
          <p className="text-muted-foreground">加载失败，请刷新重试</p>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="bg-card/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-primary/50 mb-4" />
          <p className="text-muted-foreground">暂无正在分析的项目</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="bg-card/50">
          <CardContent className="p-4 space-y-4">
            {/* 标题行 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {(task.meta as { project_name?: string })?.project_name || "未命名项目"}
                </span>
              </div>
              <TaskStatusBadge status={task.status} />
            </div>

            {/* 进度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{task.message}</span>
                <span className="font-mono text-primary">
                  {Math.round(task.progress)}%
                </span>
              </div>
              <Progress value={task.progress} className="h-1.5" />
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelMutation.mutate(task.id)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <X className="mr-1 h-3 w-3" />
                )}
                取消
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${task.project_id}`}>查看详情</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "running":
      return (
        <Badge variant="secondary" className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          分析中
        </Badge>
      );
    case "queued":
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          排队中
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">{status}</Badge>
      );
  }
}
