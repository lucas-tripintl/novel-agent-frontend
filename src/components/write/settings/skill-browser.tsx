"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  getSkillCategoryKey,
  getSkillStageKey,
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
  labelKey: string;
}[];

export function SkillBrowser({ projectId }: SkillBrowserProps) {
  const t = useTranslations("skills");
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
    async (skillId: string, stage: SkillStage) => {
      await disableMutation.mutateAsync({ skillId, stage });
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
    <div className="flex flex-col h-full w-full min-w-0">
      {/* 头部 */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50">
        <span className="text-xs text-muted-foreground truncate">
          {t("configureByStage")}
        </span>
      </div>

      {/* 阶段列表 */}
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-1">
          {/* 加载状态 */}
          {isLoading && (
            <>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="p-1.5 rounded border border-border/50 bg-card/30"
                >
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-3 flex-1" />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 错误状态 */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle className="h-6 w-6 text-destructive mb-1.5" />
              <p className="text-xs text-muted-foreground">{t("loadFailed")}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1.5 h-6 text-xs"
                onClick={() => refetch()}
              >
                {t("retry")}
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
                    <div className="rounded border border-border/50 bg-card/30 overflow-hidden min-w-0">
                      {/* 阶段标题 */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors min-w-0">
                          <ChevronRight
                            className={cn(
                              "h-3 w-3 text-muted-foreground transition-transform shrink-0",
                              isExpanded && "rotate-90"
                            )}
                          />
                          <span className="font-medium text-xs flex-1 truncate min-w-0">
                            {t(stage.labelKey)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1 shrink-0"
                          >
                            {skills.length}/{MAX_SKILLS_PER_STAGE}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>

                      {/* 技能列表 */}
                      <CollapsibleContent>
                        <div className="px-2 pb-1.5 pt-1 space-y-1 border-t border-border/30">
                          {skills.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground py-1.5 text-center">
                              {t("noSkills")}
                            </p>
                          ) : (
                            skills.map((skill) => (
                              <StageSkillItem
                                key={`${stage.value}-${skill.id}`}
                                skill={skill}
                                onRemove={() => handleRemoveSkill(skill.skill_id, stage.value)}
                                isRemoving={disableMutation.isPending}
                                t={t}
                              />
                            ))
                          )}

                          {/* 添加按钮 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-6 text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={() => setAddingStage(stage.value)}
                            disabled={!canAdd}
                          >
                            <Plus className="h-2.5 w-2.5 mr-0.5" />
                            {canAdd ? t("addSkill") : t("limitReached")}
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
  t,
}: {
  skill: ProjectSkillRead;
  onRemove: () => void;
  isRemoving: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="group flex items-center gap-1 px-1.5 py-1 rounded bg-background/50 hover:bg-accent/30 transition-colors min-w-0">
      <span className="text-[11px] flex-1 truncate min-w-0">{skill.skill_name}</span>
      <Badge variant="outline" className="text-[10px] h-3.5 px-0.5 shrink-0 hidden sm:inline-flex">
        {t(getSkillCategoryKey(skill.skill_category))}
      </Badge>
      {/* 如果是所有阶段生效的技能，显示标记 */}
      {!skill.stage && (
        <Badge variant="secondary" className="text-[10px] h-3.5 px-0.5 shrink-0">
          {t("global")}
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={onRemove}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
        ) : (
          <X className="h-2.5 w-2.5" />
        )}
      </Button>
    </div>
  );
}
