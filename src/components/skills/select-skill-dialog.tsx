"use client";

import { useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Check,
  Loader2,
  Star,
  Lock,
  Wand2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  useSkills,
  getSkillCategoryLabel,
  getSkillStageLabel,
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
  SkillCategory,
  SkillSortBy,
  SortOrder,
} from "@/types/skills";
import { cn } from "@/lib/utils";

interface SelectSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前选中的技能 ID */
  selectedSkillId: string | null;
  /** 选择技能回调 */
  onSelect: (skill: SkillBrief | null) => void;
}

/** 每页显示数量 */
const PAGE_SIZE = 20;

/**
 * 选择技能对话框（仅选择，不添加到项目）
 * 用于 AI 助手临时选择当前对话使用的技能
 */
export function SelectSkillDialog({
  open,
  onOpenChange,
  selectedSkillId,
  onSelect,
}: SelectSkillDialogProps) {
  const [pendingSkill, setPendingSkill] = useState<SkillBrief | null>(null);

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<SkillSortBy>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // 获取技能列表
  const { data: skillsData, isLoading } = useSkills({
    limit: PAGE_SIZE,
    skip: currentPage * PAGE_SIZE,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    keyword: searchQuery || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const skills = skillsData?.items ?? [];
  const totalItems = skillsData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // 重置状态
  const resetState = useCallback(() => {
    setPendingSkill(null);
    setSearchQuery("");
    setCategoryFilter("all");
    setCurrentPage(0);
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
    setCurrentPage(0);
  }, []);

  const handleCategoryChange = useCallback((value: SkillCategory | "all") => {
    setCategoryFilter(value);
    setCurrentPage(0);
  }, []);

  const handleSortChange = useCallback((value: SkillSortBy) => {
    setSortBy(value);
    setCurrentPage(0);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(0);
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect(pendingSkill);
    handleOpenChange(false);
  }, [pendingSkill, onSelect, handleOpenChange]);

  const handleClear = useCallback(() => {
    onSelect(null);
    handleOpenChange(false);
  }, [onSelect, handleOpenChange]);

  // 判断技能是否已选中
  const isSelected = (skill: SkillBrief) =>
    pendingSkill?.id === skill.id ||
    (!pendingSkill && selectedSkillId === skill.id);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[550px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle>选择写作技能</DialogTitle>
        </DialogHeader>

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
                  {option.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 overflow-hidden">
            {/* 搜索框和排序 */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索技能名称或描述..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={toggleSortOrder}
                title={sortOrder === "desc" ? "降序" : "升序"}
              >
                {sortOrder === "desc" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* 技能列表 */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : skills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Wand2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || categoryFilter !== "all"
                      ? "没有找到匹配的技能"
                      : "暂无可用技能"}
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
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className={cn(
                          "p-3 rounded-md cursor-pointer transition-all",
                          isSelected(skill)
                            ? "bg-primary/10 border-2 border-primary/50 shadow-sm"
                            : "bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-accent/30"
                        )}
                        onClick={() => setPendingSkill(skill)}
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
                              {isSelected(skill) && (
                                <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
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

        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0 flex-row justify-between sm:justify-between">
          <div>
            {selectedSkillId && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                取消选择
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!pendingSkill}>
              <Check className="mr-2 h-4 w-4" />
              确认
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
