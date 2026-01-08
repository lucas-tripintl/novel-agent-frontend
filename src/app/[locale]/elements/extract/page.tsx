"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { CreateStep } from "@/components/elements/extract/create-step";
import { ProcessingList } from "@/components/elements/extract/processing-list";
import { HistoryList } from "@/components/elements/extract/history-list";
import { useActiveTasks } from "@/hooks/use-task-polling";

// 假设元素提取的任务类型
const PATTERN_EXTRACT_JOB_TYPE = "extract_patterns";

export default function ExtractPage() {
    const [activeTab, setActiveTab] = useState("create");

    // 获取活跃任务数量
    const { data: allActiveTasks = [] } = useActiveTasks();
    const activeTaskCount = allActiveTasks.filter(task =>
        task.job_type === PATTERN_EXTRACT_JOB_TYPE ||
        task.job_type.includes("pattern")
    ).length;

    const handleCreateSuccess = () => {
        setActiveTab("processing");
    };

    return (
        <MainLayout>
            <div className="flex flex-col h-full overflow-hidden">
                {/* 页头 */}
                <div className="shrink-0 pb-4 border-b border-border/40">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        元素提取
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        从已分析设定的作品中提取元素，用于融合创作
                    </p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 pt-4">
                    <TabsList className="shrink-0 mb-4 w-fit">
                        <TabsTrigger value="create">新建任务</TabsTrigger>
                        <TabsTrigger value="processing">
                            分析中
                            {activeTaskCount > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center text-xs">
                                    {activeTaskCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history">提取历史</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="mt-0">
                        <CreateStep onSuccess={handleCreateSuccess} />
                    </TabsContent>

                    <TabsContent value="processing" className="mt-0">
                        <ProcessingList />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <HistoryList />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
