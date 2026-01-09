"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  Sparkles,
  Zap,
  ChevronRight,
  X,
  Play,
  PenLine,
} from "lucide-react";
import { EntityBrowserDialog } from "@/components/browser/entity-browser-dialog";
import { SkillBrowserDialog } from "@/components/browser/skill-browser-dialog";
import type { EntityRead } from "@/types/api";
import type { SkillBrief } from "@/types/skills";
import type {
  ChapterGenerationMode,
  ChapterDecisionDensity,
  StartChapterWritingRequest,
} from "@/types/chapter-writing";
import {
  chapterGenerationModes,
  chapterDensityOptions,
} from "@/types/chapter-writing";

interface WriteChapterDialogProps {
  projectId: string;
  chapterNumber: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartGeneration: (
    params: Omit<StartChapterWritingRequest, "chapter_number">
  ) => Promise<void>;
  isGenerating?: boolean;
}

const MAX_GUIDANCE_LENGTH = 2000;

export function WriteChapterDialog({
  projectId,
  chapterNumber,
  open,
  onOpenChange,
  onStartGeneration,
  isGenerating = false,
}: WriteChapterDialogProps) {
  // Form state
  const [guidance, setGuidance] = useState("");
  const [mode, setMode] = useState<ChapterGenerationMode>("interactive");
  const [density, setDensity] = useState<ChapterDecisionDensity>("simple");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Entity/Skill selection state
  const [selectedEntities, setSelectedEntities] = useState<EntityRead[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SkillBrief[]>([]);
  const [entityBrowserOpen, setEntityBrowserOpen] = useState(false);
  const [skillBrowserOpen, setSkillBrowserOpen] = useState(false);

  // Sync with external props when dialog opens
  useEffect(() => {
    if (open) {
      setGuidance("");
      setMode("interactive");
      setDensity("simple");
      setSelectedEntities([]);
      setSelectedSkills([]);
    }
  }, [open]);

  // Reset form and handle dialog state
  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting || isGenerating) return;
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!chapterNumber) return;

    setIsSubmitting(true);
    try {
      await onStartGeneration({
        mode,
        density,
        writing_guidance: guidance.trim() || undefined,
        selected_entities:
          selectedEntities.length > 0
            ? selectedEntities.map((e) => e.id)
            : undefined,
        selected_skills:
          selectedSkills.length > 0
            ? selectedSkills.map((s) => s.id)
            : undefined,
      });
      // 关闭对话框（生成开始后）
      onOpenChange(false);
    } catch (err) {
      console.error("启动生成失败:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || isGenerating;
  const canSubmit = chapterNumber !== null && !isPending;

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
            <PenLine className="h-5 w-5 text-primary" />
            生成正文
          </DialogTitle>
          <DialogDescription>
            {chapterNumber
              ? `配置第 ${chapterNumber} 章的正文生成参数`
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
                  onValueChange={(v) => setMode(v as ChapterGenerationMode)}
                  className="grid grid-cols-3 gap-2"
                  disabled={isPending}
                >
                  {chapterGenerationModes.map((modeConfig) => (
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
                        ${isPending ? "opacity-50 cursor-not-allowed" : ""}
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
                  onValueChange={(v) => setDensity(v as ChapterDecisionDensity)}
                  className="grid grid-cols-2 gap-2"
                  disabled={isPending}
                >
                  {chapterDensityOptions.map((densityConfig) => (
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
                        ${isPending ? "opacity-50 cursor-not-allowed" : ""}
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
                  placeholder="描述写作风格、重点内容、特殊要求...&#10;例如：本章重点描写主角的心理变化，节奏放缓，多用内心独白"
                  className="min-h-[80px] resize-none"
                  value={guidance}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_GUIDANCE_LENGTH) {
                      setGuidance(e.target.value);
                    }
                  }}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {guidance.length}/{MAX_GUIDANCE_LENGTH} 字符
                </p>
              </div>

              {/* 参考设定（选填） */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 h-9 text-sm border border-border/50 hover:border-primary/30"
                  onClick={() => setEntityBrowserOpen(true)}
                  disabled={isPending}
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
                  disabled={isPending}
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
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPending ? "启动中..." : "开始生成"}
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
        description="选择用于正文生成的参考设定"
      />

      {/* 技能浏览器对话框 */}
      <SkillBrowserDialog
        open={skillBrowserOpen}
        onOpenChange={setSkillBrowserOpen}
        initialSelected={selectedSkills}
        stageFilter="writing"
        selectionMode="multiple"
        onConfirm={setSelectedSkills}
        title="选择技能"
        description="选择用于正文生成的写作技能"
      />
    </Dialog>
  );
}
