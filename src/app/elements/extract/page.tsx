"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateStep } from "@/components/elements/extract/create-step";
import { ProcessingList } from "@/components/elements/extract/processing-list";
import { HistoryList } from "@/components/elements/extract/history-list";
import { useActiveTasks } from "@/hooks/use-task-polling";

// 假设模式提取的任务类型
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
            <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
                {/* 页头 */}
                <div className="shrink-0 mb-8 space-y-4">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                        <Link href="/elements">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            返回元素库
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            模式提取
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            从已分析的作品中提取可复用的抽象模式，用于融合创作
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="bg-card/50 border border-border/50 shrink-0 mb-6 w-fit">
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
