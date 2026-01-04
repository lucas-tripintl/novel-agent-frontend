"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Earth,
  Zap,
  GitBranch,
  Sparkles,
  PenTool,
  BookOpen,
  Flame,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AnalysisType } from "@/types/api";

/** 分析项目配置 */
interface AnalysisTypeConfig {
  type: AnalysisType;
  label: string;
  description: string;
  icon: React.ElementType;
  fixedChapters?: number; // 如果设置，固定分析前 N 章
}

/** 所有可用的分析类型 */
const ANALYSIS_TYPES: AnalysisTypeConfig[] = [
  {
    type: "golden_opening",
    label: "黄金三章分析",
    description: "开篇前3章深度分析（固定范围）",
    icon: BookOpen,
    fixedChapters: 3,
  },
  {
    type: "entity_extraction",
    label: "实体提取",
    description: "角色/地点/势力/道具/功法等",
    icon: Users,
  },
  {
    type: "golden_finger",
    label: "金手指识别",
    description: "主角外挂能力识别与追踪",
    icon: Zap,
  },
  {
    type: "plotline",
    label: "剧情线分析",
    description: "冲突/转折/高潮识别",
    icon: GitBranch,
  },
  {
    type: "worldview",
    label: "世界观提取",
    description: "背景设定/力量体系/社会结构",
    icon: Earth,
  },
  {
    type: "cool_point",
    label: "爽点分析",
    description: "情绪高潮/爽点密度/节奏感",
    icon: Flame,
  },
  {
    type: "technique",
    label: "写作技巧分析",
    description: "叙事手法/文笔风格/描写技巧",
    icon: PenTool,
  },

];

export interface AnalyzeConfig {
  projectId: string;
  projectName: string;
  totalChapters: number;
  analysisTypes: AnalysisType[];
  startChapter: number;
  endChapter: number;
  force: boolean;
  // 保留风格分析（独立 API）
  enableStyleAnalyze: boolean;
  styleSampleChapters: number;
}

interface ConfigStepProps {
  projectId: string;
  projectName: string;
  totalChapters: number;
  importedChapters: number;
  onBack: () => void;
  onStart: (config: AnalyzeConfig) => void;
  isPending?: boolean;
  error?: Error | null;
}

export function ConfigStep({
  projectId,
  projectName,
  totalChapters,
  importedChapters,
  onBack,
  onStart,
  isPending = false,
  error = null,
}: ConfigStepProps) {
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(importedChapters);
  const [force, setForce] = useState(false);

  // 分析类型选择
  const [selectedTypes, setSelectedTypes] = useState<Set<AnalysisType>>(
    new Set(["golden_opening"])
  );

  // 风格分析（独立控制）
  const [enableStyleAnalyze, setEnableStyleAnalyze] = useState(false);
  const [styleSampleChapters, setStyleSampleChapters] = useState(10);

  // 切换分析类型
  const toggleType = useCallback((type: AnalysisType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedTypes.size === ANALYSIS_TYPES.length) {
      setSelectedTypes(new Set());
    } else {
      setSelectedTypes(new Set(ANALYSIS_TYPES.map((t) => t.type)));
    }
  }, [selectedTypes.size]);

  const handleStart = useCallback(() => {
    if (selectedTypes.size === 0 && !enableStyleAnalyze) {
      return; // 至少选择一个分析项目
    }

    onStart({
      projectId,
      projectName,
      totalChapters,
      analysisTypes: Array.from(selectedTypes),
      startChapter,
      endChapter,
      force,
      enableStyleAnalyze,
      styleSampleChapters,
    });
  }, [
    projectId,
    projectName,
    totalChapters,
    selectedTypes,
    startChapter,
    endChapter,
    force,
    enableStyleAnalyze,
    styleSampleChapters,
    onStart,
  ]);

  // 处理滑块值变化
  const handleSliderChange = (values: number[]) => {
    setStartChapter(values[0]);
    setEndChapter(values[1]);
  };

  // 处理起始章节输入变化
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(Number(e.target.value) || 1, endChapter));
    setStartChapter(value);
  };

  // 处理结束章节输入变化
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(
      startChapter,
      Math.min(Number(e.target.value) || importedChapters, importedChapters)
    );
    setEndChapter(value);
  };

  // 检查是否选中了黄金三章分析
  const hasGoldenOpening = selectedTypes.has("golden_opening");

  // 是否有可以执行的分析
  const canStart = selectedTypes.size > 0 || enableStyleAnalyze;

  return (
    <div className="space-y-6">
      {/* 项目信息 */}
      <Card className="bg-card/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-20 shrink-0">作品名称</Label>
            <span className="text-sm font-medium">{projectName}</span>
          </div>

          {/* 章节范围 */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-20 shrink-0">分析范围</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">第</span>
                <Input
                  type="number"
                  min={1}
                  max={endChapter}
                  value={startChapter}
                  onChange={handleStartChange}
                  className="w-20 h-8 text-center font-mono"
                />
                <span className="text-muted-foreground">~</span>
                <Input
                  type="number"
                  min={startChapter}
                  max={importedChapters}
                  value={endChapter}
                  onChange={handleEndChange}
                  className="w-20 h-8 text-center font-mono"
                />
                <span className="text-sm text-muted-foreground">章</span>
                <span className="text-sm text-muted-foreground ml-2">
                  (共 {endChapter - startChapter + 1} 章)
                </span>
              </div>
            </div>
            {/* 可拖动滑块 */}
            <div className="flex items-center gap-4">
              <div className="w-20 shrink-0" />
              <div className="flex-1 max-w-md">
                <Slider
                  value={[startChapter, endChapter]}
                  onValueChange={handleSliderChange}
                  min={1}
                  max={importedChapters}
                  step={1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>第 1 章</span>
                  <span>第 {importedChapters} 章</span>
                </div>
              </div>
            </div>

            {/* 黄金三章提示 */}
            {hasGoldenOpening && (
              <div className="flex items-center gap-4">
                <div className="w-20 shrink-0" />
                <div className="text-xs text-amber-500 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  黄金三章分析将固定分析前 3 章，不受上方范围限制
                </div>
              </div>
            )}
          </div>

          {/* 强制重新分析 */}
          <div className="flex items-center gap-4">
            <div className="w-20 shrink-0" />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="force"
                checked={force}
                onCheckedChange={(checked) => setForce(!!checked)}
              />
              <Label htmlFor="force" className="text-sm text-muted-foreground cursor-pointer">
                重新分析（覆盖已有结果）
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分析项目选择 */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">分析项目</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {selectedTypes.size}/{ANALYSIS_TYPES.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSelectAll}
              >
                {selectedTypes.size === ANALYSIS_TYPES.length ? "取消全选" : "全选"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            选择要执行的分析任务
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {ANALYSIS_TYPES.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedTypes.has(item.type);

            return (
              <div
                key={item.type}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                  ? "bg-primary/5 border-primary/30"
                  : "bg-transparent border-transparent hover:bg-accent/50"
                  }`}
                onClick={() => toggleType(item.type)}
              >
                <Checkbox
                  id={item.type}
                  checked={isSelected}
                  onCheckedChange={() => toggleType(item.type)}
                />
                <Label
                  htmlFor={item.type}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <Icon
                    className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {item.description}
                    </span>
                  </div>
                  {item.fixedChapters && (
                    <Badge variant="outline" className="text-xs">
                      前 {item.fixedChapters} 章
                    </Badge>
                  )}
                </Label>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 风格分析（独立 API） */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">附加分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${enableStyleAnalyze
              ? "bg-primary/5 border-primary/30"
              : "bg-transparent border-transparent hover:bg-accent/50"
              }`}
            onClick={() => setEnableStyleAnalyze(!enableStyleAnalyze)}
          >
            <Checkbox
              id="style-analyze"
              checked={enableStyleAnalyze}
              onCheckedChange={(checked) => setEnableStyleAnalyze(!!checked)}
            />
            <Label
              htmlFor="style-analyze"
              className="flex items-center gap-3 cursor-pointer flex-1"
            >
              <Sparkles
                className={`h-4 w-4 ${enableStyleAnalyze ? "text-primary" : "text-muted-foreground"
                  }`}
              />
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium">风格分析</span>
                <span className="text-sm text-muted-foreground">采样</span>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={styleSampleChapters}
                  onChange={(e) => setStyleSampleChapters(Number(e.target.value))}
                  className="w-16 h-7 text-sm"
                  disabled={!enableStyleAnalyze}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm text-muted-foreground">章分析写作风格</span>
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            启动分析失败：{error.message || "请稍后重试"}
          </AlertDescription>
        </Alert>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack} disabled={isPending}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <Button
          onClick={handleStart}
          disabled={isPending || !canStart}
          className="glow-green"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              启动中...
            </>
          ) : (
            <>
              开始分析
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
