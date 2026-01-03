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
import {
  Blend,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Shuffle,
  RefreshCw,
  Layers,
  Swords,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { Steps } from "@/components/common/steps";
import { cn } from "@/lib/utils";
import { type FusionMode, type SelectedElement, fusionModes } from "@/types/fusion";
import { ProjectElementSelector } from "@/components/fusion/project-element-selector";

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
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
  const [selectedMode, setSelectedMode] = useState<FusionMode | null>(null);
  const [userIdeas, setUserIdeas] = useState("");
  const [candidateCount, setCandidateCount] = useState(3);
  const [isCreating, setIsCreating] = useState(false);

  // 处理元素选择变化
  const handleElementsChange = useCallback((elements: SelectedElement[]) => {
    setSelectedElements(elements);
  }, []);

  // 按项目分组的元素统计
  const elementsByProject = useMemo(() => {
    const map = new Map<string, { projectId: string; count: number; types: Set<string> }>();
    selectedElements.forEach((el) => {
      if (!map.has(el.projectId)) {
        map.set(el.projectId, { projectId: el.projectId, count: 0, types: new Set() });
      }
      const item = map.get(el.projectId)!;
      item.count++;
      item.types.add(el.entityType);
    });
    return Array.from(map.values());
  }, [selectedElements]);

  // 涉及的项目数量
  const involvedProjectCount = elementsByProject.length;

  // 创建融合任务
  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    // 模拟创建过程
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 跳转到任务详情页
    router.push("/fusion/task-new");
  }, [router]);

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
        // 只要选中至少1个元素即可
        return selectedElements.length >= 1;
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

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-4">
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
            <p className="text-muted-foreground mt-1">
              选择要融合的元素，配置融合参数
            </p>
          </div>
        </div>

        {/* 步骤指示器 */}
        <Steps steps={createSteps} currentStep={currentStep} />

        {/* 步骤内容 */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            {/* 步骤 1: 选择融合元素 */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">选择要融合的元素</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      已选 {selectedElements.length} 个元素
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                      来自 {involvedProjectCount} 个项目
                    </Badge>
                  </div>
                </div>

                <ProjectElementSelector
                  onSelectionChange={handleElementsChange}
                  initialSelection={selectedElements}
                  minSelection={1}
                />

                {selectedElements.length < 1 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      请至少选择 1 个元素进行融合
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* 步骤 2: 选择融合模式 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">选择融合模式</Label>

                <RadioGroup
                  value={selectedMode || ""}
                  onValueChange={(value) => setSelectedMode(value as FusionMode)}
                >
                  <div className="grid gap-4 grid-cols-2">
                    {fusionModes.map((mode) => {
                      const Icon = fusionModeIcons[mode.id];
                      return (
                        <Card
                          key={mode.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            selectedMode === mode.id
                              ? "border-primary bg-primary/5"
                              : "bg-card/50 border-border/50 hover:border-primary/30"
                          )}
                          onClick={() => setSelectedMode(mode.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={mode.id} className="mt-1" />
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
              </div>
            )}

            {/* 步骤 3: 添加创意 */}
            {currentStep === 2 && (
              <div className="space-y-4">
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
              <div className="space-y-6">
                <Label className="text-lg font-semibold">确认融合配置</Label>

                <div className="space-y-4">
                  {/* 已选元素统计 */}
                  <div className="py-2 border-b border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">选中元素</span>
                      <Badge variant="outline" className="font-mono">
                        {selectedElements.length} 个元素，来自 {involvedProjectCount} 个项目
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedElements.slice(0, 10).map((el) => (
                        <Badge key={el.entityId} variant="secondary" className="text-xs">
                          {el.name}
                        </Badge>
                      ))}
                      {selectedElements.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedElements.length - 10} 更多
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">融合模式</span>
                    <Badge variant="outline">
                      {fusionModes.find((m) => m.id === selectedMode)?.name}
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
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
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
                  {isCreating ? "创建中..." : "开始融合"}
                  <Blend className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
