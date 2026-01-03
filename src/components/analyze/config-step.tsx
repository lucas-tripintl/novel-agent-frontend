"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Loader2, Users, Earth, Zap, GitBranch, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface AnalyzeConfig {
  projectId: string;
  projectName: string;
  totalChapters: number;
  startChapter: number;
  endChapter: number;
  enableEntityExtract: boolean;
  enableGoldenFinger: boolean;
  enablePlotline: boolean;
  enableWorldviewSynthesize: boolean;
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
  const [name, setName] = useState(projectName);
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(importedChapters);

  // 分析项目开关
  const [enableEntityExtract, setEnableEntityExtract] = useState(true);
  const [enableGoldenFinger, setEnableGoldenFinger] = useState(true);
  const [enablePlotline, setEnablePlotline] = useState(true);
  const [enableWorldviewSynthesize, setEnableWorldviewSynthesize] = useState(true);
  const [enableStyleAnalyze, setEnableStyleAnalyze] = useState(false);
  const [styleSampleChapters, setStyleSampleChapters] = useState(10);

  const handleStart = useCallback(() => {
    onStart({
      projectId,
      projectName: name,
      totalChapters,
      startChapter,
      endChapter,
      enableEntityExtract,
      enableGoldenFinger,
      enablePlotline,
      enableWorldviewSynthesize,
      enableStyleAnalyze,
      styleSampleChapters,
    });
  }, [
    projectId,
    name,
    totalChapters,
    startChapter,
    endChapter,
    enableEntityExtract,
    enableGoldenFinger,
    enablePlotline,
    enableWorldviewSynthesize,
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
    const value = Math.max(startChapter, Math.min(Number(e.target.value) || importedChapters, importedChapters));
    setEndChapter(value);
  };

  return (
    <div className="space-y-6">
      {/* 项目信息 */}
      <Card className="bg-card/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-20 shrink-0">作品名称</Label>
            <span className="text-sm font-medium">{name}</span>
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
          </div>
        </CardContent>
      </Card>

      {/* 分析项目 */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">分析项目</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 实体提取 */}
          <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/50">
            <Checkbox
              id="entity-extract"
              checked={enableEntityExtract}
              onCheckedChange={(checked) => setEnableEntityExtract(!!checked)}
            />
            <Label htmlFor="entity-extract" className="flex items-center gap-2 cursor-pointer flex-1">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <span className="font-medium">实体提取</span>
                <span className="text-sm text-muted-foreground ml-2">
                  角色/地点/势力/道具/功法等
                </span>
              </div>
            </Label>
          </div>

          {/* 金手指识别 */}
          <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/50">
            <Checkbox
              id="golden-finger"
              checked={enableGoldenFinger}
              onCheckedChange={(checked) => setEnableGoldenFinger(!!checked)}
            />
            <Label htmlFor="golden-finger" className="flex items-center gap-2 cursor-pointer flex-1">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <span className="font-medium">金手指识别</span>
                <span className="text-sm text-muted-foreground ml-2">
                  主角外挂能力识别与追踪
                </span>
              </div>
            </Label>
          </div>

          {/* 剧情线分析 */}
          <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/50">
            <Checkbox
              id="plotline"
              checked={enablePlotline}
              onCheckedChange={(checked) => setEnablePlotline(!!checked)}
            />
            <Label htmlFor="plotline" className="flex items-center gap-2 cursor-pointer flex-1">
              <GitBranch className="h-4 w-4 text-primary" />
              <div>
                <span className="font-medium">剧情线分析</span>
                <span className="text-sm text-muted-foreground ml-2">
                  冲突/转折/高潮识别
                </span>
              </div>
            </Label>
          </div>

          {/* 世界观合成 */}
          <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/50">
            <Checkbox
              id="worldview-synthesize"
              checked={enableWorldviewSynthesize}
              onCheckedChange={(checked) => setEnableWorldviewSynthesize(!!checked)}
            />
            <Label htmlFor="worldview-synthesize" className="flex items-center gap-2 cursor-pointer flex-1">
              <Earth className="h-4 w-4 text-primary" />
              <div>
                <span className="font-medium">世界观合成</span>
                <span className="text-sm text-muted-foreground ml-2">
                  碎片整合为完整设定
                </span>
              </div>
            </Label>
          </div>

          {/* 风格分析 */}
          <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/50">
            <Checkbox
              id="style-analyze"
              checked={enableStyleAnalyze}
              onCheckedChange={(checked) => setEnableStyleAnalyze(!!checked)}
            />
            <Label htmlFor="style-analyze" className="flex items-center gap-2 cursor-pointer flex-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="flex items-center gap-2">
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
        <Button onClick={handleStart} disabled={isPending} className="glow-green">
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
