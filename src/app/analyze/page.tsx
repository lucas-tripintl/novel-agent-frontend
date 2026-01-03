"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap } from "lucide-react";
import { Steps } from "@/components/common/steps";
import {
  UploadStep,
  ConfigStep,
  LoadingStep,
  ResultSummary,
  AnalyzingList,
  HistoryList,
} from "@/components/analyze";
import type { AnalyzeConfig } from "@/components/analyze/config-step";
import type { ProjectImportResponse } from "@/types/api";
import { analyzeProject, analyzeStyle, synthesizeWorldview } from "@/lib/api/projects";
import { cancelTask } from "@/lib/api/tasks";
import { useTaskPolling, useActiveTasks } from "@/hooks/use-task-polling";

// 导入向导步骤
const importSteps = [
  { id: 1, title: "上传文件" },
  { id: 2, title: "配置分析" },
  { id: 3, title: "分析中" },
];

type AnalyzeStep = "upload" | "config" | "loading" | "result";

export default function AnalyzePage() {
  const queryClient = useQueryClient();

  // 流程状态
  const [currentStep, setCurrentStep] = useState<AnalyzeStep>("upload");
  const [importData, setImportData] = useState<ProjectImportResponse | null>(null);
  const [analyzeConfig, setAnalyzeConfig] = useState<AnalyzeConfig | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // 活跃任务数量（用于 Tab 徽章）
  const { data: activeTasks = [] } = useActiveTasks();

  // 任务轮询
  const { error: taskError } = useTaskPolling(currentTaskId, {
    enabled: currentStep === "loading" && !!currentTaskId,
    onComplete: () => {
      setCurrentStep("result");
      setCurrentTaskId(null);
    },
    onFailed: () => {
      // 任务失败，保持在 loading 状态但显示错误
      setCurrentTaskId(null);
    },
  });

  // 分析 mutation
  const analyzeMutation = useMutation({
    mutationFn: async (config: AnalyzeConfig) => {
      // 1. 开始实体分析
      const analyzeResult = await analyzeProject(config.projectId, {
        start_chapter: config.startChapter,
        end_chapter: config.endChapter,
        use_v2: true,
      });

      // 2. 如果启用风格分析，同时启动
      if (config.enableStyleAnalyze) {
        await analyzeStyle(config.projectId, {
          sample_chapters: config.styleSampleChapters,
        });
      }

      // 3. 如果启用世界观合成，同时启动
      if (config.enableWorldviewSynthesize) {
        await synthesizeWorldview(config.projectId);
      }

      return analyzeResult;
    },
    onSuccess: (result) => {
      setCurrentTaskId(result.data.task_id);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // 取消任务
  const cancelMutation = useMutation({
    mutationFn: cancelTask,
    onSuccess: () => {
      setCurrentStep("config");
      setCurrentTaskId(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // 导入成功回调
  const handleImportSuccess = useCallback((data: ProjectImportResponse) => {
    setImportData(data);
    setCurrentStep("config");
  }, []);

  // 开始分析
  const handleStartAnalyze = useCallback((config: AnalyzeConfig) => {
    setAnalyzeConfig(config);
    setCurrentStep("loading");
    analyzeMutation.mutate(config);
  }, [analyzeMutation]);

  // 返回配置
  const handleBackToUpload = useCallback(() => {
    setCurrentStep("upload");
    setImportData(null);
  }, []);

  // 继续导入
  const handleContinue = useCallback(() => {
    setCurrentStep("upload");
    setImportData(null);
    setAnalyzeConfig(null);
    setCurrentTaskId(null);
  }, []);

  // 取消分析
  const handleCancel = useCallback(() => {
    if (currentTaskId) {
      cancelMutation.mutate(currentTaskId);
    } else {
      setCurrentStep("config");
    }
  }, [currentTaskId, cancelMutation]);

  // 当前步骤索引
  const stepIndex =
    currentStep === "upload" ? 0 :
    currentStep === "config" ? 1 :
    currentStep === "loading" ? 2 :
    2;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            设定提取
          </h1>
          <p className="text-muted-foreground mt-1">
            上传小说文件，智能提取设定与角色
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="upload">上传</TabsTrigger>
            <TabsTrigger value="analyzing">
              分析中
              {activeTasks.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center text-xs">
                  {activeTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">历史</TabsTrigger>
          </TabsList>

          {/* 上传 Tab */}
          <TabsContent value="upload" className="space-y-6">
            {/* 步骤指示器 */}
            {currentStep !== "upload" && (
              <Steps steps={importSteps} currentStep={stepIndex + 1} />
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

            {currentStep === "loading" && analyzeConfig && (
              <LoadingStep
                projectName={analyzeConfig.projectName}
                startChapter={analyzeConfig.startChapter}
                endChapter={analyzeConfig.endChapter}
                onCancel={handleCancel}
                error={taskError || analyzeMutation.error}
                isCancelling={cancelMutation.isPending}
              />
            )}

            {currentStep === "result" && analyzeConfig && (
              <ResultSummary
                projectId={analyzeConfig.projectId}
                projectName={analyzeConfig.projectName}
                onContinue={handleContinue}
              />
            )}
          </TabsContent>

          {/* 分析中 Tab */}
          <TabsContent value="analyzing">
            <AnalyzingList />
          </TabsContent>

          {/* 历史 Tab */}
          <TabsContent value="history">
            <HistoryList />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
