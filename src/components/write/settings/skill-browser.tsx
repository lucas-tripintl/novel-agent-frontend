"use client";

import { useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { AddSkillToStageDialog } from "@/components/skills/add-skill-to-stage-dialog";
import {
  useProjectSkills,
  useDisableProjectSkill,
  getSkillCategoryLabel,
  getSkillStageLabel,
  SKILL_STAGE_OPTIONS,
} from "@/hooks/use-skills";
import type { ProjectSkillRead, SkillStage } from "@/types/skills";
import { cn } from "@/lib/utils";

interface SkillBrowserProps {
  projectId: string;
}

/** 每阶段最大技能数 */
const MAX_SKILLS_PER_STAGE = 3;

/** 阶段列表（排除 "all"） */
const STAGES = SKILL_STAGE_OPTIONS.filter((o) => o.value !== "all") as {
  value: SkillStage;
  label: string;
}[];

export function SkillBrowser({ projectId }: SkillBrowserProps) {
  // 当前打开添加对话框的阶段
  const [addingStage, setAddingStage] = useState<SkillStage | null>(null);
  // 折叠状态
  const [expandedStages, setExpandedStages] = useState<Set<SkillStage>>(
    new Set(STAGES.map((s) => s.value))
  );

  // 获取项目已启用技能
  const {
    data: projectSkills,
    isLoading,
    isError,
    refetch,
  } = useProjectSkills(projectId);

  // Mutations
  const disableMutation = useDisableProjectSkill(projectId);

  // 按阶段分组技能
  const skillsByStage = useMemo(() => {
    const map: Record<SkillStage, ProjectSkillRead[]> = {
      outline: [],
      chapter_outline: [],
      writing: [],
      rewriting: [],
      review: [],
    };

    if (!projectSkills) return map;

    for (const skill of projectSkills) {
      if (skill.stage) {
        // 技能指定了特定阶段
        map[skill.stage].push(skill);
      } else {
        // 技能适用于所有阶段，添加到每个阶段
        for (const stage of STAGES) {
          map[stage.value].push(skill);
        }
      }
    }

    return map;
  }, [projectSkills]);

  const handleRemoveSkill = useCallback(
    async (skillId: string) => {
      await disableMutation.mutateAsync(skillId);
    },
    [disableMutation]
  );

  const toggleStage = useCallback((stage: SkillStage) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  }, []);

  const canAddToStage = useCallback(
    (stage: SkillStage) => {
      return skillsByStage[stage].length < MAX_SKILLS_PER_STAGE;
    },
    [skillsByStage]
  );

  // 获取某阶段已使用的技能 ID，用于过滤
  const getUsedSkillIdsForStage = useCallback(
    (stage: SkillStage) => {
      return new Set(skillsByStage[stage].map((s) => s.skill_id));
    },
    [skillsByStage]
  );

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-sm text-muted-foreground">
          按阶段配置技能
        </span>
      </div>

      {/* 阶段列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* 加载状态 */}
          {isLoading && (
            <>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="p-2 rounded-md border border-border/50 bg-card/30"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 错误状态 */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">加载失败</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => refetch()}
              >
                重试
              </Button>
            </div>
          )}

          {/* 阶段分组 */}
          {!isLoading && !isError && (
            <>
              {STAGES.map((stage) => {
                const skills = skillsByStage[stage.value];
                const isExpanded = expandedStages.has(stage.value);
                const canAdd = canAddToStage(stage.value);

                return (
                  <Collapsible
                    key={stage.value}
                    open={isExpanded}
                    onOpenChange={() => toggleStage(stage.value)}
                  >
                    <div className="rounded-md border border-border/50 bg-card/30 overflow-hidden">
                      {/* 阶段标题 */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/30 transition-colors">
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                          <span className="font-medium text-sm flex-1">
                            {stage.label}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs h-5 px-1.5"
                          >
                            {skills.length}/{MAX_SKILLS_PER_STAGE}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>

                      {/* 技能列表 */}
                      <CollapsibleContent>
                        <div className="px-3 pb-2 pt-1 space-y-1.5 border-t border-border/30">
                          {skills.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 text-center">
                              暂无技能
                            </p>
                          ) : (
                            skills.map((skill) => (
                              <StageSkillItem
                                key={`${stage.value}-${skill.id}`}
                                skill={skill}
                                onRemove={() => handleRemoveSkill(skill.skill_id)}
                                isRemoving={disableMutation.isPending}
                              />
                            ))
                          )}

                          {/* 添加按钮 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setAddingStage(stage.value)}
                            disabled={!canAdd}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {canAdd ? "添加技能" : "已达上限"}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* 添加技能对话框 */}
      {addingStage && (
        <AddSkillToStageDialog
          projectId={projectId}
          initialStage={addingStage}
          usedSkillIds={getUsedSkillIdsForStage(addingStage)}
          open={!!addingStage}
          onOpenChange={(open) => !open && setAddingStage(null)}
          onSuccess={() => {
            refetch();
            setAddingStage(null);
          }}
        />
      )}
    </div>
  );
}

/** 阶段内的技能卡片 */
function StageSkillItem({
  skill,
  onRemove,
  isRemoving,
}: {
  skill: ProjectSkillRead;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 rounded bg-background/50 hover:bg-accent/30 transition-colors">
      <span className="text-xs flex-1 truncate">{skill.skill_name}</span>
      <Badge variant="outline" className="text-[10px] h-4 px-1">
        {getSkillCategoryLabel(skill.skill_category)}
      </Badge>
      {/* 如果是所有阶段生效的技能，显示标记 */}
      {!skill.stage && (
        <Badge variant="secondary" className="text-[10px] h-4 px-1">
          全局
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={onRemove}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
