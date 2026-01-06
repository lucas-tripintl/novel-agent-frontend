"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useGenerateSkill,
  SKILL_CATEGORY_OPTIONS,
  SKILL_STAGE_OPTIONS,
} from "@/hooks/use-skills";
import { usePatterns, PATTERN_TYPE_OPTIONS } from "@/hooks/use-patterns";
import { useEntitiesGlobal, type EntityReadWithProject } from "@/hooks/use-entities-global";
import { elementCategories, getEntityTypeLabel } from "@/hooks/use-project-elements";
import type { SkillCategory, SkillStage } from "@/types/skills";
import type { PatternRead } from "@/types/pattern";
import { getPatternTypeLabel } from "@/types/pattern";
import type { EntityType } from "@/types/api";

/** 字数限制常量 */
const GUIDANCE_MAX_LENGTH = 2000;
const REFERENCE_MAX_LENGTH = 10000;

interface GenerateSkillDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 生成成功回调，返回生成的技能 ID */
  onSuccess?: (skillId: string) => void;
}

/** 适用阶段多选组件 */
function StageCheckboxes({
  value,
  onChange,
  disabled,
}: {
  value: SkillStage[];
  onChange: (stages: SkillStage[]) => void;
  disabled?: boolean;
}) {
  const stages = SKILL_STAGE_OPTIONS.filter((o) => o.value !== "all");

  const handleToggle = (stage: SkillStage, checked: boolean) => {
    if (checked) {
      onChange([...value, stage]);
    } else {
      onChange(value.filter((s) => s !== stage));
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {stages.map((stage) => (
        <div key={stage.value} className="flex items-center space-x-2">
          <Checkbox
            id={`gen-stage-${stage.value}`}
            checked={value.includes(stage.value as SkillStage)}
            onCheckedChange={(checked) =>
              handleToggle(stage.value as SkillStage, checked === true)
            }
            disabled={disabled}
          />
          <label
            htmlFor={`gen-stage-${stage.value}`}
            className="text-sm cursor-pointer"
          >
            {stage.label}
          </label>
        </div>
      ))}
    </div>
  );
}

/** 格式化模式为参考内容 */
function formatPatternForReference(pattern: PatternRead): string {
  const typeLabel = getPatternTypeLabel(pattern.entity_type);
  return `【${typeLabel}】${pattern.name}：${pattern.content || "暂无内容描述"}\n\n`;
}

/** 格式化设定为参考内容 */
function formatEntityForReference(entity: EntityReadWithProject): string {
  const typeLabel = getEntityTypeLabel(entity.entity_type);
  const projectInfo = entity.project_name ? `[${entity.project_name}]` : "";
  return `【${typeLabel}】${entity.name}${projectInfo}：${entity.content || "暂无内容描述"}\n\n`;
}

/** 计算模式拼接后的总字数 */
function calculatePatternLength(patterns: PatternRead[]): number {
  return patterns.reduce(
    (sum, p) => sum + formatPatternForReference(p).length,
    0
  );
}

/** 计算设定拼接后的总字数 */
function calculateEntityLength(entities: EntityReadWithProject[]): number {
  return entities.reduce(
    (sum, e) => sum + formatEntityForReference(e).length,
    0
  );
}

/** 设定类型选项 */
const ENTITY_TYPE_OPTIONS: { value: EntityType | "all"; label: string }[] = [
  { value: "all", label: "全部类型" },
  ...elementCategories.map((cat) => ({
    value: cat.type,
    label: cat.label,
  })),
];

export function GenerateSkillDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateSkillDialogProps) {
  // 表单状态
  const [guidance, setGuidance] = useState("");
  const [category, setCategory] = useState<SkillCategory>("technique");
  const [stages, setStages] = useState<SkillStage[]>(["writing"]);
  const [selectedPatterns, setSelectedPatterns] = useState<PatternRead[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<EntityReadWithProject[]>([]);

  // 模式筛选状态
  const [patternTypeFilter, setPatternTypeFilter] = useState<EntityType | "all">("all");
  const [patternSearch, setPatternSearch] = useState("");

  // 设定筛选状态
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | "all">("all");
  const [entitySearch, setEntitySearch] = useState("");

  // Tab 状态 - 用于懒加载设定
  const [activeTab, setActiveTab] = useState<string>("patterns");

  // 获取模式列表
  const { data: patternsData, isLoading: isPatternsLoading } = usePatterns({
    entity_type: patternTypeFilter === "all" ? undefined : patternTypeFilter,
    keyword: patternSearch || undefined,
    limit: 50,
  });

  // 获取设定列表 - 只有切换到设定 tab 时才查询
  const { data: entitiesData, isLoading: isEntitiesLoading } = useEntitiesGlobal({
    entityType: entityTypeFilter === "all" ? undefined : entityTypeFilter,
    keyword: entitySearch || undefined,
    limit: 50,
    enabled: activeTab === "entities",
  });

  const patterns = patternsData?.items ?? [];
  const entities = entitiesData?.items ?? [];

  // 生成技能 mutation
  const generateMutation = useGenerateSkill();

  // 计算字数
  const guidanceLength = guidance.length;
  const patternLength = calculatePatternLength(selectedPatterns);
  const entityLength = calculateEntityLength(selectedEntities);
  const totalReferenceLength = patternLength + entityLength;
  const isGuidanceOverLimit = guidanceLength > GUIDANCE_MAX_LENGTH;
  const isReferenceOverLimit = totalReferenceLength > REFERENCE_MAX_LENGTH;

  // 判断是否可提交 - guidance 改为选填
  const canSubmit =
    !generateMutation.isPending &&
    !isGuidanceOverLimit &&
    !isReferenceOverLimit &&
    stages.length > 0;

  // 切换模式选择
  const togglePattern = useCallback((pattern: PatternRead) => {
    setSelectedPatterns((prev) => {
      const isSelected = prev.some((p) => p.id === pattern.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== pattern.id);
      } else {
        return [...prev, pattern];
      }
    });
  }, []);

  // 移除已选模式
  const removePattern = useCallback((patternId: string) => {
    setSelectedPatterns((prev) => prev.filter((p) => p.id !== patternId));
  }, []);

  // 切换设定选择
  const toggleEntity = useCallback((entity: EntityReadWithProject) => {
    setSelectedEntities((prev) => {
      const isSelected = prev.some((e) => e.id === entity.id);
      if (isSelected) {
        return prev.filter((e) => e.id !== entity.id);
      } else {
        return [...prev, entity];
      }
    });
  }, []);

  // 移除已选设定
  const removeEntity = useCallback((entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  }, []);

  // 提交生成
  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return;

    // 拼接参考内容（先模式后设定）
    const patternContent = selectedPatterns.map(formatPatternForReference).join("");
    const entityContent = selectedEntities.map(formatEntityForReference).join("");
    const referenceContent = patternContent + entityContent || undefined;

    try {
      const result = await generateMutation.mutateAsync({
        guidance: guidance.trim() || "根据参考内容生成技能",
        reference_content: referenceContent,
        category,
        applicable_stages: stages,
      });

      // 重置表单
      setGuidance("");
      setSelectedPatterns([]);
      setSelectedEntities([]);
      setCategory("technique");
      setStages(["writing"]);

      // 关闭对话框并回调
      onOpenChange(false);
      onSuccess?.(result.skill_id);
    } catch {
      // 错误由 mutation 处理
    }
  }, [
    canSubmit,
    guidance,
    selectedPatterns,
    selectedEntities,
    category,
    stages,
    generateMutation,
    onOpenChange,
    onSuccess,
  ]);

  // 重置状态
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setGuidance("");
        setSelectedPatterns([]);
        setSelectedEntities([]);
        setCategory("technique");
        setStages(["writing"]);
        setPatternTypeFilter("all");
        setPatternSearch("");
        setEntityTypeFilter("all");
        setEntitySearch("");
        setActiveTab("patterns");
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  // 判断模式是否已选中
  const isPatternSelected = useMemo(() => {
    const selectedIds = new Set(selectedPatterns.map((p) => p.id));
    return (patternId: string) => selectedIds.has(patternId);
  }, [selectedPatterns]);

  // 判断设定是否已选中
  const isEntitySelected = useMemo(() => {
    const selectedIds = new Set(selectedEntities.map((e) => e.id));
    return (entityId: string) => selectedIds.has(entityId);
  }, [selectedEntities]);

  const hasSelectedItems = selectedPatterns.length > 0 || selectedEntities.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 生成技能
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="pl-1 pr-4 py-1 space-y-5">
            {/* 生成指导 - 选填，高度缩小 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="guidance">生成指导（选填）</Label>
                <span
                  className={`text-xs ${
                    isGuidanceOverLimit
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {guidanceLength} / {GUIDANCE_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id="guidance"
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="描述你想要的技能特点、适用场景、风格要求..."
                className="min-h-[52px] resize-y"
              />
              {isGuidanceOverLimit && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  超出字数限制
                </p>
              )}
            </div>

            <Separator />

            {/* 参考内容选择 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>参考内容（可选）</Label>
                <span
                  className={`text-xs ${
                    isReferenceOverLimit
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {selectedPatterns.length > 0 && `${selectedPatterns.length} 个模式`}
                  {selectedPatterns.length > 0 && selectedEntities.length > 0 && " + "}
                  {selectedEntities.length > 0 && `${selectedEntities.length} 个设定`}
                  {hasSelectedItems && `，共 ${totalReferenceLength} / ${REFERENCE_MAX_LENGTH} 字`}
                </span>
              </div>

              {/* 已选内容展示 */}
              {hasSelectedItems && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-md">
                  {selectedPatterns.map((pattern) => (
                    <Badge
                      key={`pattern-${pattern.id}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      {pattern.name}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => removePattern(pattern.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedEntities.map((entity) => (
                    <Badge
                      key={`entity-${entity.id}`}
                      variant="outline"
                      className="text-xs"
                    >
                      {entity.name}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => removeEntity(entity.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {isReferenceOverLimit && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  参考内容超出字数限制，请移除部分内容
                </p>
              )}

              {/* Tabs 切换模式/设定 */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="patterns">模式库</TabsTrigger>
                  <TabsTrigger value="entities">设定集</TabsTrigger>
                </TabsList>

                {/* 模式选择器 */}
                <TabsContent value="patterns" className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Select
                      value={patternTypeFilter}
                      onValueChange={(v) =>
                        setPatternTypeFilter(v as EntityType | "all")
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="模式类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {PATTERN_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索模式..."
                        value={patternSearch}
                        onChange={(e) => setPatternSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <ScrollArea className="h-[160px] border rounded-md">
                    {isPatternsLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : patterns.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        暂无模式
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {patterns.map((pattern) => (
                          <div
                            key={pattern.id}
                            className={`flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                              isPatternSelected(pattern.id) ? "bg-muted" : ""
                            }`}
                            onClick={() => togglePattern(pattern)}
                          >
                            <Checkbox
                              checked={isPatternSelected(pattern.id)}
                              onCheckedChange={() => togglePattern(pattern)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {pattern.name}
                                </span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {getPatternTypeLabel(pattern.entity_type)}
                                </Badge>
                              </div>
                              {pattern.content && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {pattern.content}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* 设定选择器 */}
                <TabsContent value="entities" className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Select
                      value={entityTypeFilter}
                      onValueChange={(v) =>
                        setEntityTypeFilter(v as EntityType | "all")
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="设定类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索设定..."
                        value={entitySearch}
                        onChange={(e) => setEntitySearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <ScrollArea className="h-[160px] border rounded-md">
                    {isEntitiesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : entities.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        暂无设定
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {entities.map((entity) => (
                          <div
                            key={entity.id}
                            className={`flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                              isEntitySelected(entity.id) ? "bg-muted" : ""
                            }`}
                            onClick={() => toggleEntity(entity)}
                          >
                            <Checkbox
                              checked={isEntitySelected(entity.id)}
                              onCheckedChange={() => toggleEntity(entity)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {entity.name}
                                </span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {getEntityTypeLabel(entity.entity_type)}
                                </Badge>
                                {entity.project_name && (
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {entity.project_name}
                                  </span>
                                )}
                              </div>
                              {entity.content && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {entity.content}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            <Separator />

            {/* 技能分类 */}
            <div className="space-y-2">
              <Label>
                技能分类 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as SkillCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_CATEGORY_OPTIONS.filter((o) => o.value !== "all").map(
                    (option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 适用阶段 */}
            <div className="space-y-2">
              <Label>
                适用阶段 <span className="text-destructive">*</span>
              </Label>
              <StageCheckboxes
                value={stages}
                onChange={setStages}
                disabled={generateMutation.isPending}
              />
              {stages.length === 0 && (
                <p className="text-xs text-destructive">请至少选择一个阶段</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={generateMutation.isPending}
          >
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={!canSubmit}>
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                生成技能
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
