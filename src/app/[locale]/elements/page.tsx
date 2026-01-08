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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Library,
  Blend,
  Search,
  AlertCircle,
  Eye,
  Zap,
  GitBranch,
  Users,
  Swords,
  Heart,
  TrendingUp,
  Sparkles,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useInfinitePatterns, PATTERN_TYPE_OPTIONS, getPatternTypeKey } from "@/hooks/use-patterns";
import type { EntityType } from "@/types/api";
import { formatTimeAgo } from "@/lib/utils/time";
import { PatternDetailDialog } from "@/components/elements/pattern-detail-dialog";
import type { PatternRead } from "@/types/pattern";
import { NovelFilter } from "@/components/common/novel-filter";
import { cn } from "@/lib/utils";

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="h-4 w-4" />,
  power_system: <Zap className="h-4 w-4" />,
  plot_pattern: <GitBranch className="h-4 w-4" />,
  character_archetype: <Users className="h-4 w-4" />,
  conflict_pattern: <Swords className="h-4 w-4" />,
  relationship_dynamic: <Heart className="h-4 w-4" />,
  conflict_escalation: <TrendingUp className="h-4 w-4" />,
  cheat_evolution: <Sparkles className="h-4 w-4" />,
};

export default function ElementsPage() {
  const t = useTranslations("elements");
  const tCommon = useTranslations("common");

  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPattern, setSelectedPattern] = useState<PatternRead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 滚动容器和 sentinel 引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleViewPattern = useCallback((pattern: PatternRead) => {
    setSelectedPattern(pattern);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPattern(null);
  }, []);

  // 切换分类时重置滚动位置
  const handleTypeChange = useCallback((type: EntityType | "all") => {
    setTypeFilter(type);
    // 重置滚动位置
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, []);

  // 获取抽象模式列表（无限滚动）
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePatterns({
    entity_type: typeFilter === "all" ? undefined : typeFilter,
    keyword: debouncedSearch || undefined,
    source_project_id: selectedProjectId || undefined,
  });

  // 防抖搜索
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 合并所有页的数据
  const patterns = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  // 总数
  const total = data?.pages[0]?.total ?? 0;

  // IntersectionObserver 监听底部 sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]"),
        rootMargin: "100px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <MainLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* 标题区 */}
        <div className="shrink-0 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Library className="h-6 w-6 text-primary" />
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("description")}
              </p>
            </div>
          </div>

          {/* 筛选栏 */}
          <div className="flex items-center gap-4 mt-4">
            {/* 项目筛选 */}
            <NovelFilter
              selectedId={selectedProjectId}
              onSelectionChange={setSelectedProjectId}
              useGlobalStore={false}
              className="w-48"
            />

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

            {/* 统计 */}
            {total > 0 && (
              <span className="text-sm text-muted-foreground font-mono">
                {t("total", { count: total })}
              </span>
            )}
          </div>
        </div>

        {/* 主内容区：左侧导航 + 右侧卡片 */}
        <div className="flex flex-1 min-h-0 pt-4 gap-6">
          {/* 左侧分类导航（固定不滚动） */}
          <nav className="shrink-0 w-40">
            <div className="space-y-1">
              {PATTERN_TYPE_OPTIONS.map((option) => {
                const isActive = typeFilter === option.value;
                const Icon = categoryIcons[option.value];

                return (
                  <button
                    key={option.value}
                    onClick={() => handleTypeChange(option.value as EntityType | "all")}
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
                    <span className="truncate">{t(option.labelKey)}</span>
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
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-6 w-40 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-16 w-full" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
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

                {/* 元素网格 */}
                {!isLoading && !isError && patterns.length > 0 && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {patterns.map((pattern) => (
                        <Card
                          key={pattern.id}
                          className="bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col"
                          onClick={() => handleViewPattern(pattern)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {t(getPatternTypeKey(pattern.entity_type))}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatTimeAgo(pattern.created_at)}
                              </span>
                            </div>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                              {pattern.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col flex-1 space-y-3">
                            {/* 模式描述 */}
                            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                              {pattern.content || t("noDescription")}
                            </p>

                            {/* 标签 */}
                            {pattern.tags && pattern.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {pattern.tags.slice(0, 4).map((tag, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {pattern.tags.length > 4 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{pattern.tags.length - 4}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* 操作按钮 - 固定在底部 */}
                            <div className="flex gap-2 mt-auto pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPattern(pattern);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {tCommon("view")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link href={`/fusion/create?elements=${pattern.id}`}>
                                  <Blend className="mr-2 h-4 w-4" />
                                  {t("fusion")}
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* 加载更多指示器 / Sentinel */}
                    <div
                      ref={sentinelRef}
                      className="flex items-center justify-center py-8"
                    >
                      {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">{t("loadingMore")}</span>
                        </div>
                      )}
                      {!hasNextPage && patterns.length > 0 && (
                        <span className="text-sm text-muted-foreground/60">
                          {t("allLoaded", { count: total })}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* 空状态 */}
                {!isLoading && !isError && patterns.length === 0 && (
                  <Card className="bg-card/30 border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Library className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {searchQuery || typeFilter !== "all" || selectedProjectId
                          ? t("noMatchingPatterns")
                          : t("empty")}
                      </h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        {searchQuery || typeFilter !== "all" || selectedProjectId
                          ? tCommon("tryDifferentKeywords")
                          : t("emptyDescription")}
                      </p>
                      {(searchQuery || typeFilter !== "all" || selectedProjectId) && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setSearchQuery("");
                            setTypeFilter("all");
                            setSelectedProjectId(null);
                          }}
                        >
                          {tCommon("clearSearch")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Pattern 详情对话框 */}
      <PatternDetailDialog
        pattern={selectedPattern}
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDetail();
        }}
        onSave={(updatedPattern) => {
          setSelectedPattern(updatedPattern);
          refetch();
        }}
        onDelete={() => {
          setSelectedPattern(null);
        }}
      />
    </MainLayout>
  );
}
