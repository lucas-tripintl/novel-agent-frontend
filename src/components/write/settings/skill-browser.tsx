"use client";

import { useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  X,
  GripVertical,
  Loader2,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { AddSkillDialog } from "@/components/skills/add-skill-dialog";
import {
  useProjectSkills,
  useDisableProjectSkill,
  getSkillCategoryLabel,
  getSkillStageLabel,
} from "@/hooks/use-skills";
import type { ProjectSkillRead } from "@/types/skills";

interface SkillBrowserProps {
  projectId: string;
}

/** 最大可启用技能数 */
const MAX_SKILLS = 5;

export function SkillBrowser({ projectId }: SkillBrowserProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 获取项目已启用技能
  const {
    data: projectSkills,
    isLoading,
    isError,
    refetch,
  } = useProjectSkills(projectId);

  // Mutations
  const disableMutation = useDisableProjectSkill(projectId);

  const enabledCount = projectSkills?.length ?? 0;
  const canAddMore = enabledCount < MAX_SKILLS;

  const handleRemoveSkill = useCallback(
    async (skillId: string) => {
      await disableMutation.mutateAsync(skillId);
    },
    [disableMutation]
  );

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-sm text-muted-foreground">
          已启用 {enabledCount}/{MAX_SKILLS}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={!canAddMore}
          className="h-7 px-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>

      {/* 技能列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* 加载状态 */}
          {isLoading && (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-2 rounded-md border border-border/50 bg-card/30"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-3 w-20 mt-1" />
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

          {/* 技能列表 */}
          {!isLoading && !isError && projectSkills && (
            <>
              {projectSkills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Wand2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">暂未启用技能</p>
                </div>
              ) : (
                projectSkills.map((ps) => (
                  <ProjectSkillItem
                    key={ps.id}
                    skill={ps}
                    onRemove={() => handleRemoveSkill(ps.skill_id)}
                    isRemoving={disableMutation.isPending}
                  />
                ))
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* 添加技能对话框 */}
      <AddSkillDialog
        projectId={projectId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

/** 单个项目技能卡片 */
function ProjectSkillItem({
  skill,
  onRemove,
  isRemoving,
}: {
  skill: ProjectSkillRead;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <div className="group p-2 rounded-md border border-border/50 bg-card/30 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
        <span className="font-medium text-sm flex-1 truncate">
          {skill.skill_name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
      <div className="flex items-center gap-2 mt-1 ml-6">
        <Badge variant="outline" className="text-xs">
          {getSkillCategoryLabel(skill.skill_category)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {skill.stage ? getSkillStageLabel(skill.stage) : "所有阶段"}
        </span>
      </div>
    </div>
  );
}
