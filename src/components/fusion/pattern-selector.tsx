"use client";

/**
 * 抽象模式选择器
 * 用于融合任务创建，从元素库获取 Pattern 数据
 * 支持：分类筛选、搜索、多选、预览
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePatterns, PATTERN_TYPE_OPTIONS } from "@/hooks/use-patterns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatternDetailDialog } from "@/components/elements/pattern-detail-dialog";
import { cn } from "@/lib/utils";
import {
  Search,
  Library,
  Zap,
  Workflow,
  Users,
  Globe,
  Swords,
  Music,
  Sparkles,
  PenTool,
  Circle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Layout,
  HeartHandshake,
  TrendingUp,
  Dna,
  FileText,
  Eye,
} from "lucide-react";
import type { PatternRead } from "@/types/pattern";
import type { EntityType } from "@/types/api";
import { getPatternTypeLabel } from "@/types/pattern";

// 图标映射
const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  power_system: Zap,
  plot_pattern: Workflow,
  character_archetype: Users,
  worldview: Globe,
  conflict_pattern: Swords,
  narrative_rhythm: Music,
  cool_point_pattern: Sparkles,
  writing_technique: PenTool,
  chapter_structure: Layout,
  relationship_dynamic: HeartHandshake,
  conflict_escalation: TrendingUp,
  cheat_evolution: Dna,
  golden_opening_report: FileText,
};

/** 选中的 Pattern 信息 */
export interface SelectedPattern {
  patternId: string;
  entityType: EntityType;
  name: string;
}

interface PatternSelectorProps {
  onSelectionChange: (patterns: SelectedPattern[]) => void;
  initialSelection?: SelectedPattern[];
  minSelection?: number;
}

export function PatternSelector({
  onSelectionChange,
  initialSelection = [],
}: PatternSelectorProps) {
  const t = useTranslations("elements");
  // 状态管理
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(() => {
    return new Set(initialSelection.map((p) => p.patternId));
  });

  // 详情对话框状态
  const [detailPattern, setDetailPattern] = useState<PatternRead | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 缓存已选择的 Pattern 详情
  const [patternDetails, setPatternDetails] = useState<Map<string, PatternRead>>(
    () => new Map()
  );

  // 获取 Pattern 列表
  const {
    data: patternsData,
    isLoading,
    isFetching,
    refetch,
  } = usePatterns({
    entity_type: typeFilter === "all" ? undefined : typeFilter,
    keyword: debouncedSearch || undefined,
    limit: 100,
  });

  // 防抖搜索
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 稳定化 patterns 引用
  const patterns = useMemo(() => {
    return patternsData?.items ?? [];
  }, [patternsData?.items]);

  // 缓存加载的 Pattern 详情
  useMemo(() => {
    patterns.forEach((pattern) => {
      if (!patternDetails.has(pattern.id)) {
        setPatternDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(pattern.id, pattern);
          return newMap;
        });
      }
    });
  }, [patterns, patternDetails]);

  // 切换选择
  const togglePattern = useCallback(
    (pattern: PatternRead) => {
      setSelectedPatterns((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(pattern.id)) {
          newSet.delete(pattern.id);
        } else {
          newSet.add(pattern.id);
          // 缓存详情
          setPatternDetails((prevDetails) => {
            const newMap = new Map(prevDetails);
            newMap.set(pattern.id, pattern);
            return newMap;
          });
        }

        // 通知父组件
        const selectedList: SelectedPattern[] = [];
        newSet.forEach((id) => {
          const p = patternDetails.get(id);
          if (p) {
            selectedList.push({
              patternId: p.id,
              entityType: p.entity_type,
              name: p.name,
            });
          }
        });
        // 异步通知避免状态冲突
        setTimeout(() => onSelectionChange(selectedList), 0);

        return newSet;
      });
    },
    [patternDetails, onSelectionChange]
  );

  // 全选当前筛选结果
  const selectAll = useCallback(() => {
    setSelectedPatterns((prev) => {
      const newSet = new Set(prev);
      patterns.forEach((p) => {
        newSet.add(p.id);
        setPatternDetails((prevDetails) => {
          const newMap = new Map(prevDetails);
          newMap.set(p.id, p);
          return newMap;
        });
      });

      // 通知父组件
      const selectedList: SelectedPattern[] = [];
      newSet.forEach((id) => {
        const p = patternDetails.get(id);
        if (p) {
          selectedList.push({
            patternId: p.id,
            entityType: p.entity_type,
            name: p.name,
          });
        }
      });
      setTimeout(() => onSelectionChange(selectedList), 0);

      return newSet;
    });
  }, [patterns, patternDetails, onSelectionChange]);

  // 取消全选当前筛选结果
  const deselectAll = useCallback(() => {
    setSelectedPatterns((prev) => {
      const newSet = new Set(prev);
      patterns.forEach((p) => {
        newSet.delete(p.id);
      });

      // 通知父组件
      const selectedList: SelectedPattern[] = [];
      newSet.forEach((id) => {
        const p = patternDetails.get(id);
        if (p) {
          selectedList.push({
            patternId: p.id,
            entityType: p.entity_type,
            name: p.name,
          });
        }
      });
      setTimeout(() => onSelectionChange(selectedList), 0);

      return newSet;
    });
  }, [patterns, patternDetails, onSelectionChange]);

  // 检查当前筛选结果是否全选
  const isAllSelected = useMemo(() => {
    if (patterns.length === 0) return false;
    return patterns.every((p) => selectedPatterns.has(p.id));
  }, [patterns, selectedPatterns]);

  // 打开详情对话框
  const handleOpenDetail = useCallback((pattern: PatternRead) => {
    setDetailPattern(pattern);
    setDetailDialogOpen(true);
  }, []);

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0">
      {/* 筛选栏 */}
      <div className="flex items-center gap-4 shrink-0 flex-wrap">
        {/* 类型筛选 */}
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as EntityType | "all")}
        >
          <SelectTrigger className="w-auto min-w-32">
            <SelectValue placeholder={t("types.all")} />
          </SelectTrigger>
          <SelectContent>
            {PATTERN_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 搜索 */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索模式名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 bg-card/50"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isAllSelected ? deselectAll() : selectAll())}
            disabled={patterns.length === 0}
          >
            {isAllSelected ? (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                取消全选
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                全选
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>

        {/* 统计 */}
        <Badge variant="outline" className="font-mono shrink-0">
          已选 {selectedPatterns.size} 个模式
        </Badge>
      </div>

      {/* 模式列表 */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <Card className="bg-card/30 border-dashed">
            <CardContent className="flex flex-col items-center py-12">
              <Library className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchKeyword || typeFilter !== "all"
                  ? "没有找到匹配的模式"
                  : "暂无抽象模式"}
              </p>
              {(searchKeyword || typeFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchKeyword("");
                    setTypeFilter("all");
                  }}
                >
                  清除筛选
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <PatternGrid
            patterns={patterns}
            selectedPatterns={selectedPatterns}
            onToggle={togglePattern}
            onOpenDetail={handleOpenDetail}
          />
        )}
      </div>

      {/* 详情对话框 */}
      <PatternDetailDialog
        pattern={detailPattern}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}

// ============ Pattern 网格 ============

interface PatternGridProps {
  patterns: PatternRead[];
  selectedPatterns: Set<string>;
  onToggle: (pattern: PatternRead) => void;
  onOpenDetail: (pattern: PatternRead) => void;
}

function PatternGrid({ patterns, selectedPatterns, onToggle, onOpenDetail }: PatternGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {patterns.map((pattern) => (
        <PatternCard
          key={pattern.id}
          pattern={pattern}
          isSelected={selectedPatterns.has(pattern.id)}
          onToggle={() => onToggle(pattern)}
          onOpenDetail={() => onOpenDetail(pattern)}
        />
      ))}
    </div>
  );
}

// ============ Pattern 卡片 ============

interface PatternCardProps {
  pattern: PatternRead;
  isSelected: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
}

function PatternCard({ pattern, isSelected, onToggle, onOpenDetail }: PatternCardProps) {
  const Icon = typeIconMap[pattern.entity_type] || Circle;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all relative",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "bg-card/50 border-border/50 hover:border-primary/30"
      )}
      onClick={onToggle}
    >
      {/* 右上角查看详情按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetail();
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <CardContent className="p-4 pr-10">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            className="mt-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={onToggle}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {getPatternTypeLabel(pattern.entity_type)}
              </Badge>
            </div>
            <h4 className="font-medium text-sm truncate">{pattern.name}</h4>
            {pattern.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {pattern.content}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

