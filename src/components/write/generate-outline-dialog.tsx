"use client";

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  ChevronDown,
  X,
  Users,
  Globe,
  Layers,
  Sparkles,
  Zap,
  Play,
} from "lucide-react";
import { useEntities } from "@/hooks/use-analysis-results";
import { useSkills } from "@/hooks/use-skills";
import { useInteractiveOutline } from "@/hooks/use-interactive-outline";
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

// 参考设定的实体类型
const REFERENCE_ENTITY_TYPES: {
  type: string;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "character", label: "角色", icon: <Users className="h-3.5 w-3.5" /> },
  { type: "worldview", label: "世界观", icon: <Globe className="h-3.5 w-3.5" /> },
  { type: "plotline", label: "剧情线", icon: <Layers className="h-3.5 w-3.5" /> },
];

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
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

  // 交互式生成 Hook
  const { startGeneration, isGenerating } = useInteractiveOutline(
    projectId,
    chapterNumber
  );

  // 获取各类型实体（用于参考设定选择）
  const { data: charactersData } = useEntities(projectId, "character", {
    limit: 50,
  });
  const { data: worldviewData } = useEntities(projectId, "worldview", {
    limit: 50,
  });
  const { data: plotlineData } = useEntities(projectId, "plotline", {
    limit: 50,
  });

  // 获取适用于细纲阶段的技能列表
  const { data: skillsData } = useSkills({ stage: "chapter_outline", limit: 50 });

  const entitiesByType = useMemo(
    () => ({
      character: charactersData?.items ?? [],
      worldview: worldviewData?.items ?? [],
      plotline: plotlineData?.items ?? [],
    }),
    [charactersData, worldviewData, plotlineData]
  );

  const totalEntities = Object.values(entitiesByType).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const skills = skillsData?.items ?? [];

  // 重置表单
  const resetForm = () => {
    setMode("interactive");
    setDensity("simple");
    setGuidance("");
    setSelectedEntities([]);
    setSelectedSkills([]);
    setReferenceOpen(false);
    setSkillsOpen(false);
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

  // 切换参考设定选择
  const toggleEntity = (entity: EntityRead) => {
    setSelectedEntities((prev) => {
      const exists = prev.some((e) => e.id === entity.id);
      if (exists) {
        return prev.filter((e) => e.id !== entity.id);
      }
      return [...prev, entity];
    });
  };

  // 移除参考设定
  const removeEntity = (entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  // 切换技能选择
  const toggleSkill = (skill: SkillBrief) => {
    setSelectedSkills((prev) => {
      const exists = prev.some((s) => s.id === skill.id);
      if (exists) {
        return prev.filter((s) => s.id !== skill.id);
      }
      return [...prev, skill];
    });
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
              {totalEntities > 0 && (
                <Collapsible open={referenceOpen} onOpenChange={setReferenceOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 h-9 text-sm"
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
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          referenceOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    {/* 已选设定 */}
                    {selectedEntities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-muted/50 rounded-md">
                        {selectedEntities.map((entity) => (
                          <Badge
                            key={entity.id}
                            variant="secondary"
                            className="gap-1 pr-1"
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
                      </div>
                    )}

                    {/* 设定列表 */}
                    <div className="space-y-3 max-h-[150px] overflow-y-auto">
                      {REFERENCE_ENTITY_TYPES.map(({ type, label, icon }) => {
                        const entities =
                          entitiesByType[type as keyof typeof entitiesByType] ??
                          [];
                        if (entities.length === 0) return null;

                        return (
                          <div key={type} className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              {icon}
                              {label}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {entities.slice(0, 8).map((entity) => (
                                <label
                                  key={entity.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                                >
                                  <Checkbox
                                    checked={selectedEntities.some(
                                      (e) => e.id === entity.id
                                    )}
                                    onCheckedChange={() => toggleEntity(entity)}
                                  />
                                  <span className="truncate">{entity.name}</span>
                                </label>
                              ))}
                            </div>
                            {entities.length > 8 && (
                              <p className="text-xs text-muted-foreground pl-2">
                                还有 {entities.length - 8} 个...
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 使用技能（选填） */}
              {skills.length > 0 && (
                <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 h-9 text-sm"
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
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          skillsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    {/* 已选技能 */}
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-muted/50 rounded-md">
                        {selectedSkills.map((skill) => (
                          <Badge
                            key={skill.id}
                            variant="secondary"
                            className="gap-1 pr-1"
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
                      </div>
                    )}

                    {/* 技能列表 */}
                    <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-y-auto">
                      {skills.slice(0, 10).map((skill) => (
                        <label
                          key={skill.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={selectedSkills.some(
                              (s) => s.id === skill.id
                            )}
                            onCheckedChange={() => toggleSkill(skill)}
                          />
                          <span className="truncate">{skill.name}</span>
                        </label>
                      ))}
                    </div>
                    {skills.length > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        还有 {skills.length - 10} 个技能...
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
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
    </Dialog>
  );
}
