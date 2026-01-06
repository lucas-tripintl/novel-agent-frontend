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
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import {
  useSkills,
  SKILL_CATEGORY_OPTIONS,
  SKILL_STAGE_OPTIONS,
  SKILL_VISIBILITY_OPTIONS,
  SKILL_SORT_OPTIONS,
  getSkillCategoryLabel,
  getSkillStageLabel,
} from "@/hooks/use-skills";
import type { SkillCategory, SkillStage, SkillVisibility, SkillSortBy, SortOrder, SkillBrief } from "@/types/skills";
import { SkillDialog } from "@/components/skills/skill-dialog";
import { GenerateSkillDialog } from "@/components/skills/generate-skill-dialog";

/** 每页显示数量 */
const PAGE_SIZE = 12;

export default function SkillsPage() {
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">("all");
  const [stageFilter, setStageFilter] = useState<SkillStage | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<SkillVisibility | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SkillSortBy>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(0);

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
    // 刷新列表
    const result = await refetch();
    // 在刷新后的列表中找到新生成的技能
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

  // 筛选变化时重置分页
  const handleCategoryChange = useCallback((v: string) => {
    setCategoryFilter(v as SkillCategory | "all");
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

  // 切换排序方向
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(0);
  }, []);

  const hasFilters = searchQuery || categoryFilter !== "all" || stageFilter !== "all" || visibilityFilter !== "all";

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-primary" />
              技能库
            </h1>
            <p className="text-muted-foreground mt-1">
              可注入到 AI 写作 Prompt 中的可复用文本片段，指导写作风格与技巧
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              提取技能
            </Button>
            <Button onClick={handleCreateSkill}>
              <Plus className="mr-2 h-4 w-4" />
              创建技能
            </Button>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* 分类筛选 */}
          <Select
            value={categoryFilter}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 阶段筛选 */}
          <Select
            value={stageFilter}
            onValueChange={handleStageChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="阶段" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_STAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 来源筛选 */}
          <Select
            value={visibilityFilter}
            onValueChange={handleVisibilityChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="来源" />
            </SelectTrigger>
            <SelectContent>
              {SKILL_VISIBILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 搜索 */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索技能名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-1">
            <Select
              value={sortBy}
              onValueChange={handleSortByChange}
            >
              <SelectTrigger className="w-auto min-w-[100px]">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleSortOrder}
              title={sortOrder === "desc" ? "降序（点击切换为升序）" : "升序（点击切换为降序）"}
            >
              {sortOrder === "desc" ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* 统计 */}
          {skillsData && (
            <span className="text-sm text-muted-foreground">
              共 {skillsData.total} 个技能
            </span>
          )}
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <h3 className="font-semibold text-destructive">加载失败</h3>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "无法加载技能库数据"}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                重试
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 技能网格 */}
        {!isLoading && !isError && skills.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <Card
                  key={skill.id}
                  className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer flex flex-col"
                  onClick={() => handleViewSkill(skill)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getSkillCategoryLabel(skill.category)}
                        </Badge>
                        {skill.is_featured && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {skill.visibility === "system" ? (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          系统
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          自建
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{skill.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="space-y-3 flex-1">
                      {/* 描述 */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {skill.description || "暂无描述"}
                      </p>

                      {/* 适用阶段 */}
                      <div className="flex flex-wrap gap-1.5">
                        {skill.applicable_stages.slice(0, 3).map((stage) => (
                          <Badge
                            key={stage}
                            variant="secondary"
                            className="text-xs"
                          >
                            {getSkillStageLabel(stage)}
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
                      查看详情
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {currentPage + 1} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* 空状态 */}
        {!isLoading && !isError && skills.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wand2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {hasFilters ? "没有找到匹配的技能" : "暂无技能"}
              </h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {hasFilters
                  ? "尝试调整筛选条件"
                  : "点击「创建技能」添加您的第一个自定义技能"}
              </p>
              {hasFilters ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  清除筛选
                </Button>
              ) : (
                <Button className="mt-4" onClick={handleCreateSkill}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建技能
                </Button>
              )}
            </CardContent>
          </Card>
        )}
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
