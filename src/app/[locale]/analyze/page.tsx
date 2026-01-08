"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap } from "lucide-react";
import { Steps } from "@/components/common/steps";
import {
  UploadStep,
  ConfigStep,
  AnalyzingList,
  HistoryList,
} from "@/components/analyze";
import type { AnalyzeConfig } from "@/components/analyze/config-step";
import type { ProjectImportResponse } from "@/types/api";
import { analyzeProject } from "@/lib/api/projects";
import { useActiveTasks } from "@/hooks/use-task-polling";

type AnalyzeStep = "upload" | "config";

export default function AnalyzePage() {
  const t = useTranslations("analyze");
  const queryClient = useQueryClient();

  // 导入向导步骤
  const importSteps = [
    { id: 1, title: t("steps.upload") },
    { id: 2, title: t("steps.config") },
  ];

  // 流程状态
  const [currentStep, setCurrentStep] = useState<AnalyzeStep>("upload");
  const [importData, setImportData] = useState<ProjectImportResponse | null>(null);

  // 当前激活的 Tab
  const [activeTab, setActiveTab] = useState("upload");

  // 活跃任务数量（用于 Tab 徽章）
  const { data: activeTasks = [] } = useActiveTasks();

  // 分析 mutation
  const analyzeMutation = useMutation({
    mutationFn: async (config: AnalyzeConfig) => {
      return await analyzeProject(config.projectId, {
        analysis_types: config.analysisTypes,
        start_chapter: config.startChapter,
        end_chapter: config.endChapter,
        force: config.force,
        auto_extract_patterns: config.autoExtractPatterns,
      });
    },
    onSuccess: () => {
      // 任务提交成功后：
      // 1. 刷新任务列表
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // 2. 重置表单状态，允许继续添加新任务
      setCurrentStep("upload");
      setImportData(null);
      // 3. 切换到"分析中"Tab，让用户看到任务进度
      setActiveTab("analyzing");
    },
  });

  // 导入成功回调
  const handleImportSuccess = useCallback((data: ProjectImportResponse) => {
    setImportData(data);
    setCurrentStep("config");
  }, []);

  // 开始分析
  const handleStartAnalyze = useCallback((config: AnalyzeConfig) => {
    analyzeMutation.mutate(config);
  }, [analyzeMutation]);

  // 返回上传步骤
  const handleBackToUpload = useCallback(() => {
    setCurrentStep("upload");
    setImportData(null);
  }, []);

  // 当前步骤索引
  const stepIndex = currentStep === "upload" ? 0 : 1;

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* 页面标题 */}
        <div className="shrink-0 mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("description")}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="bg-card/50 border border-border/50 shrink-0 mb-6">
            <TabsTrigger value="upload">{t("tabs.upload")}</TabsTrigger>
            <TabsTrigger value="analyzing">
              {t("tabs.analyzing")}
              {activeTasks.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center text-xs">
                  {activeTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
          </TabsList>

          {/* 上传 Tab */}
          <TabsContent value="upload" className="flex-1 flex flex-col min-h-0 mt-0">
            {/* 步骤指示器 */}
            {currentStep !== "upload" && (
              <div className="shrink-0 mb-6">
                <Steps steps={importSteps} currentStep={stepIndex + 1} />
              </div>
            )}

            {/* 步骤内容 */}
            {currentStep === "upload" && (
              <UploadStep onSuccess={handleImportSuccess} />
            )}

            {currentStep === "config" && importData && (
              <ConfigStep
                projectId={importData.project_id}
                projectName={importData.project_name}
                totalChapters={importData.total_chapters}
                importedChapters={importData.imported_chapters}
                onBack={handleBackToUpload}
                onStart={handleStartAnalyze}
                isPending={analyzeMutation.isPending}
                error={analyzeMutation.error}
              />
            )}
          </TabsContent>

          {/* 分析中 Tab */}
          <TabsContent value="analyzing" className="mt-0">
            <AnalyzingList />
          </TabsContent>

          {/* 历史 Tab */}
          <TabsContent value="history" className="mt-0">
            <HistoryList />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
