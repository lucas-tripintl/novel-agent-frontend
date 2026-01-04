"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractPatterns } from "@/lib/api/projects";
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { NovelFilter } from "@/components/common/novel-filter";

interface CreateStepProps {
    onSuccess?: () => void;
}

export function CreateStep({ onSuccess }: CreateStepProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const queryClient = useQueryClient();

    // 提取模式 mutation
    const extractMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const response = await extractPatterns(projectId);
            return response.data;
        },
        onSuccess: (data) => {
            setStatus({ type: "success", message: "提取任务已启动，请在“分析中”标签页查看进度" });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });

            // 延迟跳转或回调
            setTimeout(() => {
                setStatus(null);
                onSuccess?.();
            }, 1500);
        },
        onError: (error) => {
            setStatus({ type: "error", message: "启动提取失败: " + error.message });
        },
    });

    const handleStart = () => {
        if (!selectedProjectId) return;
        setStatus(null);
        extractMutation.mutate(selectedProjectId);
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>新建提取任务</CardTitle>
                <CardDescription>
                    从已分析的作品中提取可复用的抽象模式（力量体系、剧情套路等）。
                    这需要作品已经完成基础的实体提取。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>选择作品</Label>
                    <NovelFilter
                        selectedId={selectedProjectId}
                        onSelectionChange={(id) => setSelectedProjectId(id || "")}
                        useGlobalStore={false}
                        className="w-full justify-between"
                    />
                </div>

                {status && (
                    <div className={`p-4 rounded-md flex items-center gap-2 text-sm ${status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                        }`}>
                        {status.type === "success" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 shrink-0" />
                        )}
                        {status.message}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleStart}
                        disabled={!selectedProjectId || extractMutation.isPending}
                        className="glow-primary min-w-[120px]"
                    >
                        {extractMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                启动中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                开始提取
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
