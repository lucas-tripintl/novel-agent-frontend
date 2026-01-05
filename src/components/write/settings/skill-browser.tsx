"use client";

import { useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  GripVertical,
  Loader2,
  AlertCircle,
  Star,
  Lock,
  Wand2,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SkillDialog } from "@/components/skills/skill-dialog";
import {
  useProjectSkills,
  useEnableProjectSkill,
  useDisableProjectSkill,
  useSkills,
  getSkillCategoryLabel,
  getSkillStageLabel,
  SKILL_STAGE_OPTIONS,
  SKILL_CATEGORY_OPTIONS,
} from "@/hooks/use-skills";
import type {
  SkillBrief,
  SkillStage,
  SkillCategory,
  ProjectSkillRead,
} from "@/types/skills";
import { cn } from "@/lib/utils";

interface SkillBrowserProps {
  projectId: string;
}

/** 最大可启用技能数 */
const MAX_SKILLS = 5;

/** 每页显示数量 */
const PAGE_SIZE = 20;

export function SkillBrowser({ projectId }: SkillBrowserProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSkillToAdd, setSelectedSkillToAdd] =
    useState<SkillBrief | null>(null);
  const [selectedStages, setSelectedStages] = useState<SkillStage[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(0);

  // 获取项目已启用技能
  const {
    data: projectSkills,
    isLoading,
    isError,
    refetch,
  } = useProjectSkills(projectId);

  // 获取可用技能列表 - 使用服务端分页
  const { data: availableSkills, isLoading: isLoadingAvailable, refetch: refetchSkills } = useSkills({
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    search: searchQuery || undefined,
  });

  // Mutations
  const enableMutation = useEnableProjectSkill(projectId);
  const disableMutation = useDisableProjectSkill(projectId);

  const enabledCount = projectSkills?.length ?? 0;
  const canAddMore = enabledCount < MAX_SKILLS;
  const skillItems = availableSkills?.items;

  // 过滤掉已启用的技能
  const filteredSkills = useMemo(() => {
    if (!skillItems) return [];
    return skillItems.filter(
      (skill) => !projectSkills?.some((ps) => ps.skill_id === skill.id)
    );
  }, [skillItems, projectSkills]);

  // 计算总页数
  const totalItems = availableSkills?.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // 重置分页当筛选条件变化时
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
  }, []);

  const handleCategoryChange = useCallback((value: SkillCategory | "all") => {
    setCategoryFilter(value);
    setCurrentPage(0);
  }, []);

  const handleOpenAddDialog = useCallback(() => {
    setSelectedSkillToAdd(null);
    setSelectedStages([]);
    setSearchQuery("");
    setCategoryFilter("all");
    setCurrentPage(0);
    setIsAddDialogOpen(true);
  }, []);

  const handleAddSkill = useCallback(async () => {
    if (!selectedSkillToAdd) return;

    await enableMutation.mutateAsync({
      skill_id: selectedSkillToAdd.id,
      // 如果没选择阶段或选了所有阶段，传 null
      stage:
        selectedStages.length === 0 ||
        selectedStages.length === SKILL_STAGE_OPTIONS.length - 1
          ? null
          : selectedStages.length === 1
            ? selectedStages[0]
            : null, // 多选时也传 null（所有阶段）
    });

    setIsAddDialogOpen(false);
    setSelectedSkillToAdd(null);
    setSelectedStages([]);
  }, [selectedSkillToAdd, selectedStages, enableMutation]);

  const handleRemoveSkill = useCallback(
    async (skillId: string) => {
      await disableMutation.mutateAsync(skillId);
    },
    [disableMutation]
  );

  const handleStageToggle = useCallback(
    (stage: SkillStage, checked: boolean) => {
      if (checked) {
        setSelectedStages((prev) => [...prev, stage]);
      } else {
        setSelectedStages((prev) => prev.filter((s) => s !== stage));
      }
    },
    []
  );

  const handleSkillCreated = useCallback(() => {
    refetchSkills();
  }, [refetchSkills]);

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
          onClick={handleOpenAddDialog}
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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-3xl h-[600px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>添加技能</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-8"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                创建技能
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* 左侧分类 Tab */}
            <div className="w-28 shrink-0 border-r border-border/50 py-2 overflow-y-auto">
              <nav className="flex flex-col gap-1 px-2">
                {SKILL_CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleCategoryChange(option.value as SkillCategory | "all")}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md text-left transition-colors",
                      categoryFilter === option.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 overflow-hidden">
              {/* 搜索框 */}
              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索技能名称或描述..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 技能列表 - 固定高度区域 */}
              <div className="flex-1 min-h-[280px] overflow-hidden">
                {isLoadingAvailable ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredSkills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Wand2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || categoryFilter !== "all"
                        ? "没有找到匹配的技能"
                        : "没有可用的技能，请先在技能库中创建"}
                    </p>
                    {(searchQuery || categoryFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter("all");
                        }}
                      >
                        清除筛选
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-2">
                      {filteredSkills.map((skill) => (
                        <div
                          key={skill.id}
                          className={cn(
                            "p-3 rounded-md cursor-pointer transition-all",
                            selectedSkillToAdd?.id === skill.id
                              ? "bg-primary/10 border-2 border-primary/50 shadow-sm"
                              : "bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-accent/30"
                          )}
                          onClick={() => setSelectedSkillToAdd(skill)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {skill.name}
                                </span>
                                {skill.is_featured && (
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                )}
                                {skill.visibility === "system" && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                                    系统
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {skill.description || "暂无描述"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {getSkillCategoryLabel(skill.category)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  适用:{" "}
                                  {skill.applicable_stages
                                    .slice(0, 2)
                                    .map((s) => getSkillStageLabel(s))
                                    .join(", ")}
                                  {skill.applicable_stages.length > 2 &&
                                    ` +${skill.applicable_stages.length - 2}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    共 {totalItems} 个技能
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 阶段选择（多选）- 移到 footer 上方，始终显示 */}
          <div className="px-6 py-3 border-t border-border/50 bg-muted/30 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                限定适用阶段（可选）
              </Label>
              <span className="text-xs text-muted-foreground">
                不选择则在所有阶段生效
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SKILL_STAGE_OPTIONS.filter((o) => o.value !== "all").map(
                (option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`add-stage-${option.value}`}
                      checked={selectedStages.includes(
                        option.value as SkillStage
                      )}
                      onCheckedChange={(checked) =>
                        handleStageToggle(
                          option.value as SkillStage,
                          checked === true
                        )
                      }
                      disabled={!selectedSkillToAdd}
                    />
                    <label
                      htmlFor={`add-stage-${option.value}`}
                      className={cn(
                        "text-sm cursor-pointer",
                        !selectedSkillToAdd && "text-muted-foreground"
                      )}
                    >
                      {option.label}
                    </label>
                  </div>
                )
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleAddSkill}
              disabled={!selectedSkillToAdd || enableMutation.isPending}
            >
              {enableMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建技能对话框 */}
      <SkillDialog
        skill={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleSkillCreated}
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
