"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Play,
} from "lucide-react";
import { useInteractiveOutline } from "@/hooks/use-interactive-outline";
import { EntityBrowserDialog } from "@/components/browser/entity-browser-dialog";
import { SkillBrowserDialog } from "@/components/browser/skill-browser-dialog";
import type { EntityRead } from "@/types/api";
import type { SkillBrief } from "@/types/skills";
import {
  outlineGenerationModes,
  outlineDensityOptions,
  type OutlineGenerationMode,
  type OutlineDensity,
} from "@/types/interactive-outline";

interface GenerateOutlineDialogProps {
  projectId: string;
  chapterNumber: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateOutlineDialog({
  projectId,
  chapterNumber,
  open,
  onOpenChange,
}: GenerateOutlineDialogProps) {
  // 表单状态
  const [mode, setMode] = useState<OutlineGenerationMode>("interactive");
  const [density, setDensity] = useState<OutlineDensity>("simple");
  const [guidance, setGuidance] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<EntityRead[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SkillBrief[]>([]);

  // 浏览器对话框状态
  const [entityBrowserOpen, setEntityBrowserOpen] = useState(false);
  const [skillBrowserOpen, setSkillBrowserOpen] = useState(false);

  // 交互式生成 Hook
  const { startGeneration, isGenerating } = useInteractiveOutline(
    projectId,
    chapterNumber
  );

  // 重置表单
  const resetForm = () => {
    setMode("interactive");
    setDensity("simple");
    setGuidance("");
    setSelectedEntities([]);
    setSelectedSkills([]);
    setEntityBrowserOpen(false);
    setSkillBrowserOpen(false);
  };

  // 处理对话框打开/关闭
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  // 处理生成
  const handleGenerate = async () => {
    await startGeneration({
      mode,
      density,
      guidance: guidance.trim() || undefined,
      selected_entities:
        selectedEntities.length > 0
          ? selectedEntities.map((e) => e.id)
          : undefined,
      selected_skills:
        selectedSkills.length > 0
          ? selectedSkills.map((s) => s.id)
          : undefined,
    });

    // 关闭对话框
    handleOpenChange(false);
  };

  // 移除参考设定
  const removeEntity = (entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  // 移除技能
  const removeSkill = (skillId: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s.id !== skillId));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] h-[85vh] max-h-[700px] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            生成细纲
          </DialogTitle>
          <DialogDescription>
            {chapterNumber
              ? `配置第 ${chapterNumber} 章的细纲生成参数`
              : "请先选择一个章节"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-5 py-4 pl-1 pr-4">
              {/* 生成模式选择 */}
              <div className="space-y-3">
                <Label>生成模式</Label>
                <RadioGroup
                  value={mode}
                  onValueChange={(v) => setMode(v as OutlineGenerationMode)}
                  className="grid grid-cols-3 gap-2"
                >
                  {outlineGenerationModes.map((modeConfig) => (
                    <label
                      key={modeConfig.id}
                      className={`
                        flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer
                        transition-all hover:border-primary/50
                        ${
                          mode === modeConfig.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }
                      `}
                    >
                      <RadioGroupItem
                        value={modeConfig.id}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">
                        {modeConfig.name}
                      </span>
                      <span className="text-xs text-muted-foreground text-center leading-tight">
                        {modeConfig.description}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* 决策密度选择 */}
              <div className="space-y-3">
                <Label>决策密度</Label>
                <RadioGroup
                  value={density}
                  onValueChange={(v) => setDensity(v as OutlineDensity)}
                  className="grid grid-cols-2 gap-2"
                >
                  {outlineDensityOptions.map((densityConfig) => (
                    <label
                      key={densityConfig.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                        transition-all hover:border-primary/50
                        ${
                          density === densityConfig.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }
                      `}
                    >
                      <RadioGroupItem
                        value={densityConfig.id}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">
                          {densityConfig.name}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {densityConfig.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* 创意指导 */}
              <div className="space-y-2">
                <Label htmlFor="guidance">创意指导（选填）</Label>
                <Textarea
                  id="guidance"
                  placeholder="描述本章的特殊要求或创作方向，例如：本章需要一场激烈的战斗，主角觉醒新能力..."
                  className="min-h-[80px] resize-none"
                  value={guidance}
                  onChange={(e) => setGuidance(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {guidance.length}/2000 字符
                </p>
              </div>

              {/* 参考设定（选填） */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 h-9 text-sm border border-border/50 hover:border-primary/30"
                  onClick={() => setEntityBrowserOpen(true)}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    参考设定（选填）
                    {selectedEntities.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        已选 {selectedEntities.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                {/* 已选设定预览 */}
                {selectedEntities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-md">
                    {selectedEntities.slice(0, 5).map((entity) => (
                      <Badge
                        key={entity.id}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs"
                      >
                        {entity.name}
                        <button
                          onClick={() => removeEntity(entity.id)}
                          className="ml-0.5 hover:bg-muted rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedEntities.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{selectedEntities.length - 5} 个
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 使用技能（选填） */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 h-9 text-sm border border-border/50 hover:border-primary/30"
                  onClick={() => setSkillBrowserOpen(true)}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    使用技能（选填）
                    {selectedSkills.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        已选 {selectedSkills.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>

                {/* 已选技能预览 */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-md">
                    {selectedSkills.slice(0, 5).map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs"
                      >
                        {skill.name}
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="ml-0.5 hover:bg-muted rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedSkills.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{selectedSkills.length - 5} 个
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!chapterNumber || isGenerating}
            className="gap-1.5"
          >
            <Play className="h-4 w-4" />
            开始生成
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 设定浏览器对话框 */}
      <EntityBrowserDialog
        projectId={projectId}
        open={entityBrowserOpen}
        onOpenChange={setEntityBrowserOpen}
        initialSelected={selectedEntities}
        selectionMode="multiple"
        onConfirm={setSelectedEntities}
        title="选择参考设定"
        description="选择用于生成细纲的参考设定"
      />

      {/* 技能浏览器对话框 */}
      <SkillBrowserDialog
        open={skillBrowserOpen}
        onOpenChange={setSkillBrowserOpen}
        initialSelected={selectedSkills}
        stageFilter="chapter_outline"
        selectionMode="multiple"
        onConfirm={setSelectedSkills}
        title="选择技能"
        description="选择用于细纲生成的写作技能"
      />
    </Dialog>
  );
}
