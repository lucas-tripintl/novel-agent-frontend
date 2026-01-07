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
  Database,
  Search,
  AlertCircle,
  Eye,
  Globe,
  User,
  GitBranch,
  Sparkles,
  BookOpen,
  Zap,
  PenTool,
  FileText,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useInfiniteEntities, ENTITY_LIBRARY_TYPE_OPTIONS } from "@/hooks/use-entities";
import { useProjects } from "@/hooks/use-projects";
import type { EntityType, EntityRead } from "@/types/api";
import { formatTimeAgo } from "@/lib/utils/time";
import { NovelFilter } from "@/components/common/novel-filter";
import { cn } from "@/lib/utils";
import { useEnumStore } from "@/stores/enum-store";
import { EntityDetailDialog } from "@/components/entities/entity-detail-dialog";

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="h-4 w-4" />,
  worldview: <Globe className="h-4 w-4" />,
  character: <User className="h-4 w-4" />,
  plotline: <GitBranch className="h-4 w-4" />,
  golden_finger: <Sparkles className="h-4 w-4" />,
  foreshadowing: <BookOpen className="h-4 w-4" />,
  cool_point_pattern: <Zap className="h-4 w-4" />,
  writing_technique: <PenTool className="h-4 w-4" />,
  golden_opening_report: <FileText className="h-4 w-4" />,
};

export default function EntitiesPage() {
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<EntityRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 滚动容器和 sentinel 引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 枚举本地化
  const getLabel = useEnumStore((state) => state.getLabel);

  // 获取项目列表（用于显示项目名称）
  const { data: projectsData } = useProjects({ limit: 100 });
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    projectsData?.items.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projectsData]);

  const handleViewEntity = useCallback((entity: EntityRead) => {
    setSelectedEntity(entity);
    setDialogOpen(true);
  }, []);

  // 切换分类时重置滚动位置
  const handleTypeChange = useCallback((type: EntityType | "all") => {
    setTypeFilter(type);
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, []);

  // 获取设定列表（无限滚动）
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteEntities({
    entity_type: typeFilter === "all" ? undefined : typeFilter,
    keyword: debouncedSearch || undefined,
    project_id: selectedProjectId || undefined,
  });

  // 防抖搜索
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 合并所有页的数据
  const entities = useMemo(() => {
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

  // 获取实体类型的本地化标签
  const getTypeLabel = (type: EntityType) => {
    const enumLabel = getLabel("EntityType", type);
    if (enumLabel !== type) return enumLabel;
    // fallback 到静态配置
    const option = ENTITY_LIBRARY_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label ?? type;
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* 标题区 */}
        <div className="shrink-0 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                设定库
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                从已分析作品中提取的设定数据
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
                placeholder="搜索设定名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>

            {/* 统计 */}
            {total > 0 && (
              <span className="text-sm text-muted-foreground font-mono">
                共 <span className="text-foreground font-semibold">{total}</span> 个设定
              </span>
            )}
          </div>
        </div>

        {/* 主内容区：左侧导航 + 右侧卡片 */}
        <div className="flex flex-1 min-h-0 pt-4 gap-6">
          {/* 左侧分类导航（固定不滚动） */}
          <nav className="shrink-0 w-40">
            <div className="space-y-1">
              {ENTITY_LIBRARY_TYPE_OPTIONS.map((option) => {
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
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 分隔线与提示 */}
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground/60 leading-relaxed px-1">
                点击分类筛选设定
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
                          {error instanceof Error ? error.message : "无法加载设定库数据"}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => refetch()}>
                        重试
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* 设定网格 */}
                {!isLoading && !isError && entities.length > 0 && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {entities.map((entity) => (
                        <Card
                          key={entity.id}
                          className="bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col"
                          onClick={() => handleViewEntity(entity)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(entity.entity_type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatTimeAgo(entity.created_at)}
                              </span>
                            </div>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                              {entity.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col flex-1 space-y-3">
                            {/* 设定描述 */}
                            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                              {entity.content || "暂无描述"}
                            </p>

                            {/* 来源项目 + 标签 */}
                            <div className="flex flex-wrap gap-1.5">
                              {/* 项目名称 */}
                              {projectNameMap.get(entity.project_id) && (
                                <Badge variant="secondary" className="text-xs">
                                  {projectNameMap.get(entity.project_id)}
                                </Badge>
                              )}
                              {/* 标签 */}
                              {entity.tags?.slice(0, 2).map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {entity.tags && entity.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{entity.tags.length - 2}
                                </Badge>
                              )}
                            </div>

                            {/* 操作按钮 - 固定在底部 */}
                            <div className="flex gap-2 mt-auto pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEntity(entity);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                查看
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
                          <span className="text-sm">加载更多...</span>
                        </div>
                      )}
                      {!hasNextPage && entities.length > 0 && (
                        <span className="text-sm text-muted-foreground/60">
                          已加载全部 {total} 个设定
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* 空状态 */}
                {!isLoading && !isError && entities.length === 0 && (
                  <Card className="bg-card/30 border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {searchQuery || typeFilter !== "all" || selectedProjectId
                          ? "没有找到匹配的设定"
                          : "暂无设定数据"}
                      </h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        {searchQuery || typeFilter !== "all" || selectedProjectId
                          ? "尝试调整筛选条件"
                          : "分析更多作品后，将在此处显示"}
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
                          清除筛选
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

      {/* 设定详情对话框 */}
      <EntityDetailDialog
        entity={selectedEntity}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(updatedEntity) => setSelectedEntity(updatedEntity)}
        onDelete={() => setSelectedEntity(null)}
        projectNameMap={projectNameMap}
      />
    </MainLayout>
  );
}
