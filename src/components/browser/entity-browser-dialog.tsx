"use client";

import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from "react";
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
  Search,
  X,
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
  Database,
  Check,
} from "lucide-react";
import { useInfiniteEntities } from "@/hooks/use-entities";
import { useEnumStore } from "@/stores/enum-store";
import type { EntityType, EntityRead } from "@/types/api";
import { cn } from "@/lib/utils";

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

// 默认的实体类型选项（常用类型）
const DEFAULT_TYPE_OPTIONS: { value: EntityType | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "character", label: "角色" },
  { value: "worldview", label: "世界观" },
  { value: "plotline", label: "剧情线" },
  { value: "golden_finger", label: "金手指" },
  { value: "foreshadowing", label: "伏笔" },
];

export interface EntityBrowserDialogProps {
  /** 项目 ID */
  projectId: string;
  /** 控制对话框开关 */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 初始已选中的实体 */
  initialSelected?: EntityRead[];
  /** 允许的实体类型 (可选，默认显示常用类型) */
  allowedTypes?: EntityType[];
  /** 选择模式：单选/多选 */
  selectionMode?: "single" | "multiple";
  /** 确认选择回调 */
  onConfirm: (selected: EntityRead[]) => void;
  /** 对话框标题 (可选) */
  title?: string;
  /** 对话框描述 (可选) */
  description?: string;
}

export function EntityBrowserDialog({
  projectId,
  open,
  onOpenChange,
  initialSelected = [],
  allowedTypes,
  selectionMode = "multiple",
  onConfirm,
  title = "选择设定",
  description = "浏览并选择需要的设定",
}: EntityBrowserDialogProps) {
  // 内部状态
  const [selectedItems, setSelectedItems] = useState<EntityRead[]>([]);
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 滚动容器和 sentinel 引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 枚举本地化
  const getLabel = useEnumStore((state) => state.getLabel);

  // 计算可用的类型选项
  const typeOptions = useMemo(() => {
    if (!allowedTypes || allowedTypes.length === 0) {
      return DEFAULT_TYPE_OPTIONS;
    }
    return [
      { value: "all" as const, label: "全部" },
      ...allowedTypes.map((type) => ({
        value: type,
        label: getLabel("EntityType", type) || type,
      })),
    ];
  }, [allowedTypes, getLabel]);

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

  // 搜索变化时重置滚动位置
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [debouncedSearch]);

  // 获取设定列表
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteEntities({
    project_id: projectId,
    entity_type: typeFilter === "all" ? undefined : typeFilter,
    keyword: debouncedSearch || undefined,
  });

  // 合并所有页的数据
  const entities = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const total = data?.pages[0]?.total ?? 0;

  // IntersectionObserver 监听底部 sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !open) return;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, open]);

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

  // 切换选择
  const toggleItem = useCallback(
    (entity: EntityRead) => {
      setSelectedItems((prev) => {
        const exists = prev.some((e) => e.id === entity.id);
        if (exists) {
          return prev.filter((e) => e.id !== entity.id);
        }
        if (selectionMode === "single") {
          return [entity];
        }
        return [...prev, entity];
      });
    },
    [selectionMode]
  );

  // 移除选择
  const removeItem = useCallback((id: string) => {
    setSelectedItems((prev) => prev.filter((e) => e.id !== id));
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
    (id: string) => selectedItems.some((e) => e.id === id),
    [selectedItems]
  );

  // 获取实体类型的本地化标签
  const getTypeLabel = useCallback(
    (type: EntityType) => {
      const enumLabel = getLabel("EntityType", type);
      if (enumLabel !== type) return enumLabel;
      const option = typeOptions.find((o) => o.value === type);
      return option?.label ?? type;
    },
    [getLabel, typeOptions]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[600px] flex flex-col p-0 overflow-hidden">
        {/* 头部 */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
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
                placeholder="搜索设定..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              {typeOptions.map((option) => {
                const isActive = typeFilter === option.value;
                const Icon = categoryIcons[option.value] || <LayoutGrid className="h-4 w-4" />;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleTypeChange(option.value as EntityType | "all")}
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
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* 右侧内容区 */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* 统计 */}
            <div className="px-4 py-2 border-b border-border/30 shrink-0">
              <span className="text-xs text-muted-foreground">
                {total > 0 ? `共 ${total} 个设定` : "暂无设定"}
              </span>
            </div>

            {/* 设定列表 */}
            <ScrollArea ref={scrollRef} className="flex-1">
              <div className="p-4 space-y-2">
                {/* 加载状态 */}
                {isLoading && (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                )}

                {/* 设定列表 */}
                {!isLoading && entities.length > 0 && (
                  <>
                    {entities.map((entity) => {
                      const selected = isSelected(entity.id);

                      return (
                        <div
                          key={entity.id}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all duration-200",
                            selected
                              ? "bg-primary/10 border-2 border-primary/50 shadow-sm"
                              : "bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-accent/30"
                          )}
                          onClick={() => toggleItem(entity)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="pt-0.5 shrink-0">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleItem(entity)}
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
                                  {entity.name}
                                </span>
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {getTypeLabel(entity.entity_type)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {entity.content || "暂无描述"}
                              </p>

                              {/* 标签 */}
                              {entity.tags && entity.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {entity.tags.slice(0, 3).map((tag, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {entity.tags.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{entity.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
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

                    {/* Sentinel */}
                    <div
                      ref={sentinelRef}
                      className="flex items-center justify-center py-4"
                    >
                      {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs">加载更多...</span>
                        </div>
                      )}
                      {!hasNextPage && entities.length > 0 && (
                        <span className="text-xs text-muted-foreground/60">
                          已加载全部
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* 空状态 */}
                {!isLoading && entities.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Database className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || typeFilter !== "all"
                        ? "没有找到匹配的设定"
                        : "暂无设定数据"}
                    </p>
                    {(searchQuery || typeFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSearchQuery("");
                          setTypeFilter("all");
                        }}
                      >
                        清除筛选
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* 已选区域 */}
        {selectedItems.length > 0 && (
          <div className="px-6 py-3 border-t border-border/50 bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground shrink-0">
                已选 {selectedItems.length} 项:
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
                    +{selectedItems.length - 8} 个
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 底部操作 */}
        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            确认 ({selectedItems.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
