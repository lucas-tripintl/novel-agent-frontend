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
import { Library, Blend, Search, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { usePatterns, PATTERN_TYPE_OPTIONS } from "@/hooks/use-patterns";
import { getPatternTypeLabel } from "@/types/pattern";
import type { EntityType } from "@/types/api";
import { formatTimeAgo } from "@/lib/utils/time";

export default function ElementsPage() {
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 获取抽象模式列表
  const {
    data: patternsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePatterns({
    entity_type: typeFilter === "all" ? undefined : typeFilter,
    keyword: debouncedSearch || undefined,
    limit: 50,
  });

  // 防抖搜索
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const patterns = patternsData?.items ?? [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              元素库
            </h1>
            <p className="text-muted-foreground mt-1">
              从已分析作品中提取的抽象模式，可用于融合创作
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            刷新
          </Button>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* 元素类型筛选 */}
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as EntityType | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="元素类型" />
            </SelectTrigger>
            <SelectContent>
              {PATTERN_TYPE_OPTIONS.map((option) => (
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
              placeholder="搜索模式名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 统计 */}
          {patternsData && (
            <span className="text-sm text-muted-foreground">
              共 {patternsData.total} 个模式
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
                <h3 className="font-semibold text-destructive">加载失败</h3>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "无法加载元素库数据"}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                重试
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 元素网格 */}
        {!isLoading && !isError && patterns.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patterns.map((pattern) => (
              <Card
                key={pattern.id}
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {getPatternTypeLabel(pattern.entity_type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimeAgo(pattern.created_at)}
                    </span>
                  </div>
                  <CardTitle className="text-base">{pattern.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 模式描述 */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {pattern.content || "暂无描述"}
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

                  {/* 来源信息 */}
                  {pattern.source_entity_ids &&
                    pattern.source_entity_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        来自 {pattern.source_entity_ids.length} 个实例
                      </p>
                    )}

                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/fusion/create?elements=${pattern.id}`}>
                      <Blend className="mr-2 h-4 w-4" />
                      用于融合
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !isError && patterns.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Library className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || typeFilter !== "all"
                  ? "没有找到匹配的模式"
                  : "暂无抽象模式"}
              </h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchQuery || typeFilter !== "all"
                  ? "尝试调整筛选条件"
                  : "分析更多作品并提取模式后，将在此处显示"}
              </p>
              {(searchQuery || typeFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                >
                  清除筛选
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
