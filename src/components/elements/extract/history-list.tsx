"use client";

import { useQuery } from "@tanstack/react-query";
import { listTasks } from "@/lib/api/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, FileText, Calendar, Box } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/time";
import Link from "next/link";
import { elementTypeLabels } from "@/types/element";

// 假设模式提取的任务类型
const PATTERN_EXTRACT_JOB_TYPE = "extract_patterns";

interface TaskMeta {
    project_name?: string;
    project_id?: string;
    result_count?: number;
    extracted_types?: string[];
}

export function HistoryList() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["tasks", "completed", "extract_patterns"],
        queryFn: async () => {
            // 获取已完成的任务
            const result = await listTasks({
                status: "completed",
                limit: 20
            });
            // 过滤出模式提取任务
            // 实际应该由后端过滤，这里先前端过滤
            const filtered = result.items.filter(task =>
                task.job_type === PATTERN_EXTRACT_JOB_TYPE ||
                task.job_type.includes("pattern")
            );
            return filtered;
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-card/50">
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
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
                    <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
                    <p className="text-muted-foreground">加载历史记录失败</p>
                </CardContent>
            </Card>
        );
    }

    const tasks = data ?? [];

    if (tasks.length === 0) {
        return (
            <Card className="bg-card/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无提取历史</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => {
                const meta = task.meta as TaskMeta | undefined;
                return (
                    <Card key={task.id} className="bg-card/50 hover:bg-card/70 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <span className="font-medium">
                                            {meta?.project_name || "模式提取任务"}
                                        </span>
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                            已完成
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatTimeAgo(task.updated_at)}
                                        </span>
                                        {meta?.result_count && (
                                            <span className="flex items-center gap-1">
                                                <Box className="h-3.5 w-3.5" />
                                                提取到 {meta.result_count} 个模式
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/elements?source=${meta?.project_id}`}>
                                        查看结果
                                    </Link>
                                </Button>
                            </div>

                            {/* 如果有提取结果摘要，可以在这里展示 */}
                            {meta?.extracted_types && Array.isArray(meta.extracted_types) && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {meta.extracted_types.map((type: string) => (
                                        <Badge key={type} variant="outline" className="text-xs">
                                            {elementTypeLabels[type as keyof typeof elementTypeLabels] || type}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

