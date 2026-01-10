"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/common/skeleton-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BaseFormDialog } from "@/components/base/base-form-dialog";
import { FormInput } from "@/components/forms/form-input";
import { useMutationLoading } from "@/hooks/use-mutation-loading";
import { Pagination, PAGE_SIZES } from "@/components/common/pagination";
import {
  Plus,
  Loader2,
  Star,
  Lock,
  Wand2,
  Search,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { SkillDialog } from "@/components/skills/skill-dialog";
import {
  useProjectSkills,
  useEnableProjectSkill,
  useSkills,
  getSkillCategoryKey,
  getSkillStageKey,
  SKILL_STAGE_OPTIONS,
  SKILL_CATEGORY_OPTIONS,
  SKILL_SORT_OPTIONS,
} from "@/hooks/use-skills";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SkillBrief,
  SkillStage,
  SkillCategory,
  SkillSortBy,
  SortOrder,
} from "@/types/skills";
import { cn } from "@/lib/utils";

interface AddSkillDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** 每页显示数量 - 使用标准化常量 */
const PAGE_SIZE = PAGE_SIZES.MEDIUM;

export function AddSkillDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: AddSkillDialogProps) {
  const t = useTranslations("skills");
  const [selectedSkillToAdd, setSelectedSkillToAdd] =
    useState<SkillBrief | null>(null);
  const [selectedStages, setSelectedStages] = useState<SkillStage[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1); // 1-based for Pagination component
  const [sortBy, setSortBy] = useState<SkillSortBy>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // 获取项目已启用技能（用于过滤）
  const { data: projectSkills } = useProjectSkills(projectId, undefined, open);

  // 获取可用技能列表 - 使用服务端分页 (转换为0-based给API)
  const {
    data: availableSkills,
    isLoading: isLoadingAvailable,
    refetch: refetchSkills,
  } = useSkills({
    limit: PAGE_SIZE,
    skip: (currentPage - 1) * PAGE_SIZE, // Convert 1-based to 0-based for API
    category: categoryFilter === "all" ? undefined : categoryFilter,
    keyword: searchQuery || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  // 启用技能 - 使用 useMutationLoading 进行可靠的加载状态管理
  const enableProjectSkillMutation = useEnableProjectSkill(projectId);
  const { mutate: enableSkill, isLoading: isEnabling } = useMutationLoading({
    mutationFn: async (data: { skill_id: string; stage: SkillStage | null }) => {
      return enableProjectSkillMutation.mutateAsync(data);
    },
    onSuccess: () => {
      handleOpenChange(false);
      onSuccess?.();
    },
  });

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

  // 重置状态
  const resetState = useCallback(() => {
    setSelectedSkillToAdd(null);
    setSelectedStages([]);
    setSearchQuery("");
    setCategoryFilter("all");
    setCurrentPage(1); // Reset to page 1
    setSortBy("updated_at");
    setSortOrder("desc");
  }, []);

  // 对话框关闭时重置
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetState();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, resetState]
  );

  // 重置分页当筛选条件变化时
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1
  }, []);

  const handleCategoryChange = useCallback((value: SkillCategory | "all") => {
    setCategoryFilter(value);
    setCurrentPage(1); // Reset to page 1
  }, []);

  const handleSortChange = useCallback((value: SkillSortBy) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to page 1
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(1); // Reset to page 1
  }, []);

  const handleAddSkill = useCallback(async () => {
    if (!selectedSkillToAdd) return;

    await enableSkill({
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
  }, [
    selectedSkillToAdd,
    selectedStages,
    enableSkill,
  ]);

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
    <>
      <BaseFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={t("addSkill")}
        maxWidth="3xl"
        className="h-[600px] flex flex-col p-0 overflow-hidden"
        showDefaultFooter={false}
        footer={
          <>
            {/* 阶段选择（多选）- 移到 footer 上方，始终显示 */}
            <div className="px-6 py-3 border-t border-border/50 bg-muted/30 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">
                  {t("limitStages")}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {t("allStagesIfEmpty")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {SKILL_STAGE_OPTIONS.filter((o) => o.value !== "all").map(
                  (option) => (
                    <div key={option.value} className="flex items-center space-x-2">
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
                        {t(option.labelKey)}
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/50 shrink-0 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-8"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                {t("createSkill")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleAddSkill}
                  disabled={!selectedSkillToAdd || isEnabling}
                >
                  {isEnabling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {t("add")}
                </Button>
              </div>
            </div>
          </>
        }
      >
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 左侧分类 Tab */}
          <div className="w-28 shrink-0 border-r border-border/50 py-2 overflow-y-auto">
            <nav className="flex flex-col gap-1 px-2">
              {SKILL_CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    handleCategoryChange(option.value as SkillCategory | "all")
                  }
                  className={cn(
                    "px-3 py-2 text-sm rounded-md text-left transition-colors",
                    categoryFilter === option.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </nav>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 overflow-hidden">
            {/* 搜索框和排序 */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <FormInput
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              {/* 排序控件 */}
              <Select
                value={sortBy}
                onValueChange={(v) => handleSortChange(v as SkillSortBy)}
              >
                <SelectTrigger className="w-auto min-w-[90px] shrink-0">
                  <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={toggleSortOrder}
                title={sortOrder === "desc" ? t("descending") : t("ascending")}
              >
                {sortOrder === "desc" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 技能列表 - 固定高度区域 */}
            <div className="flex-1 min-h-[280px] overflow-hidden">
              {isLoadingAvailable ? (
                <SkeletonList count={5} itemHeight={64} />
              ) : filteredSkills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Wand2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || categoryFilter !== "all"
                      ? t("noMatchingSkills")
                      : t("noSkillsCreate")}
                  </p>
                  {(searchQuery || categoryFilter !== "all") && (
                    <div className="flex items-center justify-between mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter("all");
                        }}
                      >
                        {t("clearFilters")}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {t("totalSkills", { count: totalItems })}
                      </span>
                    </div>
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
                                  {t("system")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {skill.description || t("noDescription")}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {t(getSkillCategoryKey(skill.category))}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {t("applicableTo")}:{" "}
                                {skill.applicable_stages
                                  .slice(0, 2)
                                  .map((s) => t(getSkillStageKey(s)))
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

            {/* 分页 - 使用标准化 Pagination 组件 */}
            {totalPages > 1 && (
              <div className="pt-3 mt-3 border-t border-border/50 shrink-0">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={PAGE_SIZE}
                  totalItems={totalItems}
                  disabled={isLoadingAvailable}
                  className="justify-center"
                />
              </div>
            )}
          </div>
        </div>
      </BaseFormDialog>

      {/* 创建技能对话框 */}
      <SkillDialog
        skill={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleSkillCreated}
      />
    </>
  );
}
