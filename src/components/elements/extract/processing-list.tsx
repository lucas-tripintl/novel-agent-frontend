"use client";

import { useActiveTasks } from "@/hooks/use-task-polling";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cancelTask } from "@/lib/api/tasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, AlertCircle, X } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/time";

// 假设模式提取的任务类型
const PATTERN_EXTRACT_JOB_TYPE = "extract_patterns";

interface TaskMeta {
    project_name?: string;
    project_id?: string;
}

export function ProcessingList() {
    const { data: tasks, isLoading, error } = useActiveTasks();
    const queryClient = useQueryClient();

    const cancelMutation = useMutation({
        mutationFn: cancelTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });

    // 过滤出模式提取任务
    const extractTasks = tasks.filter(task =>
        task.job_type === PATTERN_EXTRACT_JOB_TYPE ||
        task.job_type.includes("pattern")
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    加载任务中...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="flex flex-col items-center justify-center py-8 text-destructive">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>加载任务列表失败</p>
                </CardContent>
            </Card>
        );
    }

    if (extractTasks.length === 0) {
        return (
            <Card className="bg-card/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">当前没有正在进行的提取任务</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {extractTasks.map((task) => {
                const meta = task.meta as TaskMeta | undefined;

                return (
                    <Card key={task.id} className="bg-card/50">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                    <span className="font-medium">
                                        {meta?.project_name || "模式提取任务"}
                                    </span>
                                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                                        {task.status === "running" ? "提取中" : "排队中"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        开始于 {formatTimeAgo(task.created_at)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => cancelMutation.mutate(task.id)}
                                        disabled={cancelMutation.isPending}
                                        title="取消任务"
                                    >
                                        {cancelMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <X className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>进度</span>
                                    <span>{task.progress}%</span>
                                </div>
                                <Progress value={task.progress} className="h-2" />
                            </div>

                            {task.message && (
                                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                    {task.message}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

