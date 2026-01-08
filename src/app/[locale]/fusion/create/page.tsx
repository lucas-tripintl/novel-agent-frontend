"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Blend,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Shuffle,
  RefreshCw,
  Layers,
  Swords,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { Steps } from "@/components/common/steps";
import { cn } from "@/lib/utils";
import { PatternSelector } from "@/components/fusion/pattern-selector";
import { useFusionModes, useCreateFusionTask, useRunFusionPipeline } from "@/hooks/use-fusion";
import type { FusionMode, SelectedPattern } from "@/types/fusion";

// 融合模式图标映射
const fusionModeIcons: Record<FusionMode, React.ComponentType<{ className?: string }>> = {
  mashup: Shuffle,
  twist: RefreshCw,
  abstract_recombine: Layers,
  conflict_merge: Swords,
  custom: Layers,
};

// 创建向导步骤
const createSteps = [
  { id: 1, title: "选择元素" },
  { id: 2, title: "选择融合模式" },
  { id: 3, title: "添加创意" },
  { id: 4, title: "确认" },
];

export default function FusionCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPatterns, setSelectedPatterns] = useState<SelectedPattern[]>([]);
  const [selectedMode, setSelectedMode] = useState<FusionMode | null>(null);
  const [userIdeas, setUserIdeas] = useState("");
  const [candidateCount, setCandidateCount] = useState(3);

  // API hooks
  const { data: modesData, isLoading: isLoadingModes } = useFusionModes();
  const createTask = useCreateFusionTask();
  const runPipeline = useRunFusionPipeline();

  const isCreating = createTask.isPending || runPipeline.isPending;
  const createError = createTask.error || runPipeline.error;

  // 处理模式选择变化
  const handlePatternsChange = useCallback((patterns: SelectedPattern[]) => {
    setSelectedPatterns(patterns);
  }, []);

  // 按类型分组的模式统计
  const patternsByType = useMemo(() => {
    const map = new Map<string, number>();
    selectedPatterns.forEach((p) => {
      map.set(p.entityType, (map.get(p.entityType) || 0) + 1);
    });
    return map;
  }, [selectedPatterns]);

  // 涉及的类型数量
  const involvedTypeCount = patternsByType.size;

  // 获取选中的模式 ID 列表
  const selectedPatternIds = useMemo(() => {
    return selectedPatterns.map((p) => p.patternId);
  }, [selectedPatterns]);

  // 创建融合任务
  const handleCreate = useCallback(async () => {
    if (selectedMode === null || selectedPatternIds.length < 2) return;

    try {
      // 1. 创建任务
      const task = await createTask.mutateAsync({
        source_pattern_ids: selectedPatternIds,
        fusion_mode: selectedMode,
        user_ideas: userIdeas || null,
        candidate_count: candidateCount,
      });

      // 2. 启动流水线
      await runPipeline.mutateAsync(task.id);

      // 3. 跳转到任务详情页
      router.push(`/fusion/${task.id}`);
    } catch (error) {
      console.error("创建融合任务失败:", error);
    }
  }, [selectedMode, selectedPatternIds, userIdeas, candidateCount, createTask, runPipeline, router]);

  // 下一步
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, createSteps.length - 1));
  }, []);

  // 上一步
  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // 检查当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        // 需要至少选中 2 个模式
        return selectedPatterns.length >= 2;
      case 1:
        return selectedMode !== null;
      case 2:
        return true; // 创意是可选的
      case 3:
        return true;
      default:
        return false;
    }
  };

  // 获取融合模式列表
  const fusionModes = modesData ?? [];

  return (
    <MainLayout>
      <div className="flex flex-col flex-1 min-h-0 w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/fusion">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Blend className="h-6 w-6 text-primary" />
              创建融合任务
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              选择要融合的元素，配置融合参数
            </p>
          </div>
        </div>

        {/* 步骤指示器 */}
        <Steps steps={createSteps} currentStep={currentStep} className="mb-6" />

        {/* 步骤内容 */}
        <Card className="bg-card/50 border-border/50 flex-1 flex flex-col min-h-0">
          <CardContent className="p-6 flex-1 flex flex-col min-h-0">
            {/* 步骤 1: 选择融合元素 */}
            {currentStep === 0 && (
              <div className="flex-1 flex flex-col space-y-4 min-h-0">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">从元素库选择要融合的模式</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      已选 {selectedPatterns.length} 个模式
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                      涉及 {involvedTypeCount} 种类型
                    </Badge>
                  </div>
                </div>

                <PatternSelector
                  onSelectionChange={handlePatternsChange}
                  initialSelection={selectedPatterns}
                  minSelection={2}
                />

                {selectedPatterns.length < 2 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      请从元素库选择至少 2 个模式进行融合
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* 步骤 2: 选择融合模式 */}
            {currentStep === 1 && (
              <div className="flex-1 flex flex-col space-y-4 min-h-0">
                <Label className="text-lg font-semibold">选择融合模式</Label>

                {isLoadingModes ? (
                  <div className="grid gap-4 grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedMode || ""}
                    onValueChange={(value) => setSelectedMode(value as FusionMode)}
                  >
                    <div className="grid gap-4 grid-cols-2">
                      {fusionModes.map((mode) => {
                        const Icon = fusionModeIcons[mode.mode] || Layers;
                        return (
                          <Card
                            key={mode.mode}
                            className={cn(
                              "cursor-pointer transition-all",
                              selectedMode === mode.mode
                                ? "border-primary bg-primary/5"
                                : "bg-card/50 border-border/50 hover:border-primary/30"
                            )}
                            onClick={() => setSelectedMode(mode.mode)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <RadioGroupItem value={mode.mode} className="mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-primary" />
                                    <h4 className="font-medium">{mode.name}</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {mode.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </RadioGroup>
                )}
              </div>
            )}

            {/* 步骤 3: 添加创意 */}
            {currentStep === 2 && (
              <div className="flex-1 flex flex-col space-y-4 min-h-0">
                <Label className="text-lg font-semibold">添加你的创意偏好（可选）</Label>
                <Textarea
                  placeholder="例如：我想把修仙元素和赛博朋克结合，主角是一个觉醒了古代传承的程序员..."
                  value={userIdeas}
                  onChange={(e) => setUserIdeas(e.target.value)}
                  rows={4}
                  className="bg-card/50"
                />

                <Accordion type="single" collapsible>
                  <AccordionItem value="advanced">
                    <AccordionTrigger className="text-sm">高级选项</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <Label>候选方案数量</Label>
                        <Select
                          value={String(candidateCount)}
                          onValueChange={(v) => setCandidateCount(Number(v))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* 步骤 4: 确认 */}
            {currentStep === 3 && (
              <div className="flex-1 flex flex-col space-y-6 min-h-0">
                <Label className="text-lg font-semibold">确认融合配置</Label>

                <div className="space-y-4">
                  {/* 已选模式统计 */}
                  <div className="py-2 border-b border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">选中模式</span>
                      <Badge variant="outline" className="font-mono">
                        {selectedPatterns.length} 个模式，涉及 {involvedTypeCount} 种类型
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedPatterns.slice(0, 10).map((p) => (
                        <Badge key={p.patternId} variant="secondary" className="text-xs">
                          {p.name}
                        </Badge>
                      ))}
                      {selectedPatterns.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedPatterns.length - 10} 更多
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">融合模式</span>
                    <Badge variant="outline">
                      {fusionModes.find((m) => m.mode === selectedMode)?.name ?? selectedMode}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">候选方案数</span>
                    <span className="font-mono">{candidateCount}</span>
                  </div>

                  {userIdeas && (
                    <div className="py-2">
                      <span className="text-muted-foreground block mb-2">创意偏好</span>
                      <p className="text-sm bg-muted/30 rounded-lg p-3">{userIdeas}</p>
                    </div>
                  )}
                </div>

                {/* 错误提示 */}
                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {createError instanceof Error ? createError.message : "创建失败，请重试"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-between mt-auto pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || isCreating}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                上一步
              </Button>

              {currentStep < createSteps.length - 1 ? (
                <Button onClick={nextStep} disabled={!canProceed()}>
                  下一步
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="glow-green"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      开始融合
                      <Blend className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
