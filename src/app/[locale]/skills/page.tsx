"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/empty-state";
import { PAGE_SIZES } from "@/components/common/pagination";
import {
  Wand2,
  Search,
  AlertCircle,
  Eye,
  Plus,
  Star,
  Lock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  PenTool,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Palette,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  useSkills,
  SKILL_CATEGORY_OPTIONS,
  SKILL_STAGE_OPTIONS,
  SKILL_VISIBILITY_OPTIONS,
  SKILL_SORT_OPTIONS,
  getSkillCategoryKey,
  getSkillStageKey,
} from "@/hooks/use-skills";
import type { SkillCategory, SkillStage, SkillVisibility, SkillSortBy, SortOrder, SkillBrief } from "@/types/skills";
import { SkillDialog } from "@/components/skills/skill-dialog";
import { GenerateSkillDialog } from "@/components/skills/generate-skill-dialog";
import { cn } from "@/lib/utils";

/** 每页显示数量 - 使用标准化常量 */
const PAGE_SIZE = PAGE_SIZES.SMALL;

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="h-4 w-4" />,
  writing_style: <PenTool className="h-4 w-4" />,
  dialogue: <MessageSquare className="h-4 w-4" />,
  narrative: <BookOpen className="h-4 w-4" />,
  creativity: <Lightbulb className="h-4 w-4" />,
  genre: <Palette className="h-4 w-4" />,
};

export default function SkillsPage() {
  const t = useTranslations("skills");
  const tCommon = useTranslations("common");

  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">("all");
  const [stageFilter, setStageFilter] = useState<SkillStage | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<SkillVisibility | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SkillSortBy>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(0);

  // 滚动容器引用
  const scrollRef = useRef<HTMLDivElement>(null);

  // 对话框状态
  const [selectedSkill, setSelectedSkill] = useState<SkillBrief | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // 获取技能列表
  const {
    data: skillsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSkills({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    stage: stageFilter === "all" ? undefined : stageFilter,
    visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
    keyword: debouncedSearch || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    skip: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  // 防抖搜索 - 搜索时重置分页
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const skills = skillsData?.items ?? [];
  const totalItems = skillsData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // 切换分类时重置滚动位置和分页
  const handleCategoryChange = useCallback((category: SkillCategory | "all") => {
    setCategoryFilter(category);
    setCurrentPage(0);
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, []);

  const handleViewSkill = useCallback((skill: SkillBrief) => {
    setSelectedSkill(skill);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  }, []);

  const handleCreateSkill = useCallback(() => {
    setSelectedSkill(null);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedSkill(null);
    setIsCreateMode(false);
  }, []);

  const handleSaved = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleGenerateSuccess = useCallback(async (skillId: string) => {
    const result = await refetch();
    const newSkill = result.data?.items?.find((s) => s.id === skillId);
    if (newSkill) {
      setSelectedSkill(newSkill);
      setIsCreateMode(false);
      setIsDialogOpen(true);
    }
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStageFilter("all");
    setVisibilityFilter("all");
    setSortBy("updated_at");
    setSortOrder("desc");
    setCurrentPage(0);
  }, []);

  const handleStageChange = useCallback((v: string) => {
    setStageFilter(v as SkillStage | "all");
    setCurrentPage(0);
  }, []);

  const handleVisibilityChange = useCallback((v: string) => {
    setVisibilityFilter(v as SkillVisibility | "all");
    setCurrentPage(0);
  }, []);

  const handleSortByChange = useCallback((v: string) => {
    setSortBy(v as SkillSortBy);
    setCurrentPage(0);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(0);
  }, []);

  const hasFilters = searchQuery || categoryFilter !== "all" || stageFilter !== "all" || visibilityFilter !== "all";

  return (
    <MainLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* 标题区 */}
        <div className="shrink-0 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-primary" />
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("description")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("extract")}
              </Button>
              <Button onClick={handleCreateSkill}>
                <Plus className="mr-2 h-4 w-4" />
                {t("create")}
              </Button>
            </div>
          </div>

          {/* 筛选栏 */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {/* 阶段筛选 */}
            <Select value={stageFilter} onValueChange={handleStageChange}>
              <SelectTrigger className="w-auto min-w-24">
                <SelectValue placeholder={tCommon("allStages")} />
              </SelectTrigger>
              <SelectContent>
                {SKILL_STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 来源筛选 */}
            <Select value={visibilityFilter} onValueChange={handleVisibilityChange}>
              <SelectTrigger className="w-auto min-w-24">
                <SelectValue placeholder={tCommon("allSources")} />
              </SelectTrigger>
              <SelectContent>
                {SKILL_VISIBILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 搜索 */}
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>

            {/* 排序 */}
            <div className="flex items-center gap-1">
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-auto min-w-[100px]">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder={tCommon("sortBy")} />
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
                className="h-9 w-9"
                onClick={toggleSortOrder}
                title={sortOrder === "desc" ? t("descSortTip") : t("ascSortTip")}
              >
                {sortOrder === "desc" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 统计 */}
            {totalItems > 0 && (
              <span className="text-sm text-muted-foreground font-mono">
                {t("total", { count: totalItems })}
              </span>
            )}
          </div>
        </div>

        {/* 主内容区：左侧导航 + 右侧卡片 */}
        <div className="flex flex-1 min-h-0 pt-4 gap-6">
          {/* 左侧分类导航（固定不滚动） */}
          <nav className="shrink-0 min-w-40 max-w-[200px] w-fit">
            <div className="space-y-1">
              {SKILL_CATEGORY_OPTIONS.map((option) => {
                const isActive = categoryFilter === option.value;
                const Icon = categoryIcons[option.value] || <LayoutGrid className="h-4 w-4" />;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleCategoryChange(option.value as SkillCategory | "all")}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-accent/50",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <span className={cn(
                      "transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    )}>
                      {Icon}
                    </span>
                    <span className="whitespace-nowrap">{t(option.labelKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* 分隔线与提示 */}
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground/60 leading-relaxed px-1">
                {t("clickToFilter")}
              </p>
            </div>
          </nav>

          {/* 右侧内容区（独立滚动） */}
          <div className="flex-1 min-w-0">
            <ScrollArea ref={scrollRef} className="h-full">
              <div className="pr-4">
                {/* 加载状态 */}
                {isLoading && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="bg-card/50 border-border/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-6 w-40 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-12 w-full" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-9 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* 错误状态 */}
                {isError && (
                  <Card className="bg-destructive/10 border-destructive/30">
                    <CardContent className="flex items-center gap-4 py-6">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-destructive">{tCommon("loadFailed")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {error instanceof Error ? error.message : t("loadError")}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => refetch()}>
                        {tCommon("retry")}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* 技能网格 */}
                {!isLoading && !isError && skills.length > 0 && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {skills.map((skill) => (
                        <Card
                          key={skill.id}
                          className="bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer flex flex-col"
                          onClick={() => handleViewSkill(skill)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {t(getSkillCategoryKey(skill.category))}
                                </Badge>
                                {skill.is_featured && (
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                )}
                              </div>
                              {skill.visibility === "system" ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  {t("system")}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  {t("custom")}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base">{skill.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col flex-1">
                            <div className="space-y-3 flex-1">
                              {/* 描述 */}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {skill.description || t("noDescription")}
                              </p>

                              {/* 适用阶段 */}
                              <div className="flex flex-wrap gap-1.5">
                                {skill.applicable_stages.slice(0, 3).map((stage) => (
                                  <Badge
                                    key={stage}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t(getSkillStageKey(stage))}
                                  </Badge>
                                ))}
                                {skill.applicable_stages.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{skill.applicable_stages.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* 操作按钮 - 固定在底部 */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSkill(skill);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {tCommon("viewDetails")}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* 分页控件 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 pt-6 pb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 0}
                          onClick={() => setCurrentPage((p) => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {tCommon("prevPage")}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {tCommon("page", { current: currentPage + 1, total: totalPages })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages - 1}
                          onClick={() => setCurrentPage((p) => p + 1)}
                        >
                          {tCommon("nextPage")}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* 空状态 */}
                {!isLoading && !isError && skills.length === 0 && (
                  <EmptyState
                    icon={Wand2}
                    title={hasFilters ? t("noMatchingSkills") : t("empty")}
                    description={
                      hasFilters
                        ? tCommon("tryDifferentKeywords")
                        : t("emptyDescription")
                    }
                    action={
                      hasFilters
                        ? {
                            label: tCommon("clearSearch"),
                            onClick: clearFilters,
                            variant: "outline"
                          }
                        : {
                            label: t("create"),
                            onClick: handleCreateSkill,
                            variant: "default"
                          }
                    }
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* 技能详情/编辑对话框 */}
      <SkillDialog
        skill={isCreateMode ? null : selectedSkill}
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog();
        }}
        onSave={handleSaved}
      />

      {/* AI 生成技能对话框 */}
      <GenerateSkillDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        onSuccess={handleGenerateSuccess}
      />
    </MainLayout>
  );
}
