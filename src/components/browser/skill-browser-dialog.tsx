"use client";

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  Wand2,
  Star,
  Lock,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Palette,
  Timer,
  PenTool,
  Sparkles,
  MoreHorizontal,
  LayoutGrid,
} from "lucide-react";
import {
  useSkills,
  SKILL_CATEGORY_OPTIONS,
  SKILL_SORT_OPTIONS,
  getSkillCategoryKey,
} from "@/hooks/use-skills";
import type {
  SkillBrief,
  SkillCategory,
  SkillStage,
  SkillSortBy,
  SortOrder,
} from "@/types/skills";
import { cn } from "@/lib/utils";

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="h-4 w-4" />,
  platform_style: <Palette className="h-4 w-4" />,
  rhythm: <Timer className="h-4 w-4" />,
  technique: <PenTool className="h-4 w-4" />,
  anti_ai: <Sparkles className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

/** 每页显示数量 */
const PAGE_SIZE = 20;

export interface SkillBrowserDialogProps {
  /** 控制对话框开关 */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 初始已选中的技能 */
  initialSelected?: SkillBrief[];
  /** 按阶段筛选 (可选，如 "chapter_outline") */
  stageFilter?: SkillStage;
  /** 选择模式：单选/多选 */
  selectionMode?: "single" | "multiple";
  /** 确认选择回调 */
  onConfirm: (selected: SkillBrief[]) => void;
  /** 对话框标题 (可选) */
  title?: string;
  /** 对话框描述 (可选) */
  description?: string;
}

export function SkillBrowserDialog({
  open,
  onOpenChange,
  initialSelected = [],
  stageFilter,
  selectionMode = "multiple",
  onConfirm,
  title,
  description,
}: SkillBrowserDialogProps) {
  const t = useTranslations("skills");
  const tCommon = useTranslations("common");
  // 内部状态
  const [selectedItems, setSelectedItems] = useState<SkillBrief[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<SkillSortBy>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // 追踪之前的 open 状态，在打开时同步 initialSelected
  // 这是一个有效的同步外部 props 到内部状态的用例
  const prevOpenRef = useRef(false);
  useLayoutEffect(() => {
    if (open && !prevOpenRef.current) {
      // Dialog 刚打开时，同步初始选中状态
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 同步外部 props 到内部状态
      setSelectedItems(initialSelected);
    }
    prevOpenRef.current = open;
  }, [open, initialSelected]);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 获取技能列表
  const { data: skillsData, isLoading } = useSkills({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    stage: stageFilter,
    keyword: debouncedSearch || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    skip: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const skills = skillsData?.items ?? [];
  const total = skillsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 切换分类时重置分页
  const handleCategoryChange = useCallback((category: SkillCategory | "all") => {
    setCategoryFilter(category);
    setCurrentPage(0);
  }, []);

  // 搜索时重置分页
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
  }, []);

  // 排序变化时重置分页
  const handleSortChange = useCallback((value: SkillSortBy) => {
    setSortBy(value);
    setCurrentPage(0);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(0);
  }, []);

  // 切换选择
  const toggleItem = useCallback(
    (skill: SkillBrief) => {
      setSelectedItems((prev) => {
        const exists = prev.some((s) => s.id === skill.id);
        if (exists) {
          return prev.filter((s) => s.id !== skill.id);
        }
        if (selectionMode === "single") {
          return [skill];
        }
        return [...prev, skill];
      });
    },
    [selectionMode]
  );

  // 移除选择
  const removeItem = useCallback((id: string) => {
    setSelectedItems((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // 确认选择
  const handleConfirm = useCallback(() => {
    onConfirm(selectedItems);
    onOpenChange(false);
  }, [selectedItems, onConfirm, onOpenChange]);

  // 取消
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // 判断是否选中
  const isSelected = useCallback(
    (id: string) => selectedItems.some((s) => s.id === id),
    [selectedItems]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[600px] flex flex-col p-0 overflow-hidden">
        {/* 头部 */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
            {/* 搜索框 */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 bg-background/50"
              />
            </div>
          </div>
        </DialogHeader>

        {/* 主内容区 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 左侧分类导航 */}
          <nav className="w-32 shrink-0 border-r border-border/50 py-3 overflow-y-auto">
            <div className="space-y-1 px-2">
              {SKILL_CATEGORY_OPTIONS.map((option) => {
                const isActive = categoryFilter === option.value;
                const Icon = categoryIcons[option.value] || <LayoutGrid className="h-4 w-4" />;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleCategoryChange(option.value as SkillCategory | "all")}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-accent/50",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    <span
                      className={cn(
                        "transition-colors shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground/70"
                      )}
                    >
                      {Icon}
                    </span>
                    <span className="truncate">{t(option.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* 右侧内容区 */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* 统计和排序 */}
            <div className="px-4 py-2 border-b border-border/30 shrink-0 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {total > 0 ? t("totalSkills", { count: total }) : t("noSkills")}
              </span>
              <div className="flex items-center gap-1">
                <Select
                  value={sortBy}
                  onValueChange={(v) => handleSortChange(v as SkillSortBy)}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[80px] text-xs border-0 bg-transparent">
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
                  className="h-7 w-7"
                  onClick={toggleSortOrder}
                  title={sortOrder === "desc" ? t("descending") : t("ascending")}
                >
                  {sortOrder === "desc" ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* 技能列表 */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="p-4 space-y-2">
                {/* 加载状态 */}
                {isLoading && (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                )}

                {/* 技能列表 */}
                {!isLoading && skills.length > 0 && (
                  <>
                    {skills.map((skill) => {
                      const selected = isSelected(skill.id);

                      return (
                        <div
                          key={skill.id}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all duration-200",
                            selected
                              ? "bg-primary/10 border-2 border-primary/50 shadow-sm"
                              : "bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-accent/30"
                          )}
                          onClick={() => toggleItem(skill)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="pt-0.5 shrink-0">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleItem(skill)}
                                className={cn(
                                  "transition-colors",
                                  selected && "border-primary data-[state=checked]:bg-primary"
                                )}
                              />
                            </div>

                            {/* 内容 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {skill.name}
                                </span>
                                {skill.is_featured && (
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                )}
                                {skill.visibility === "system" && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 shrink-0"
                                  >
                                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                                    {t("system")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {skill.description || t("noDescription")}
                              </p>

                              {/* 分类标签 */}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {t(getSkillCategoryKey(skill.category))}
                                </Badge>
                              </div>
                            </div>

                            {/* 选中指示 */}
                            {selected && (
                              <div className="shrink-0">
                                <Check className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* 空状态 */}
                {!isLoading && skills.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Wand2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || categoryFilter !== "all"
                        ? t("noMatchingSkills")
                        : t("noSkills")}
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
                        {t("clearFilters")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {currentPage + 1} / {totalPages}
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

        {/* 已选区域 */}
        {selectedItems.length > 0 && (
          <div className="px-6 py-3 border-t border-border/50 bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground shrink-0">
                {t("selected", { count: selectedItems.length })}:
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {selectedItems.slice(0, 8).map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs"
                  >
                    {item.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="ml-0.5 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedItems.length > 8 && (
                  <span className="text-xs text-muted-foreground">
                    +{selectedItems.length - 8}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 底部操作 */}
        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirm}>
            {t("confirm")} ({selectedItems.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
