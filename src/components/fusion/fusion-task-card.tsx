"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FusionStatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/utils/time";
import {
  MoreHorizontal,
  Settings,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { FusionTaskListWithPatterns, SourcePatternBrief } from "@/types/fusion";

// ============ Entity Type 样式映射 ============

interface EntityTypeStyle {
  /** 类型缩写（单字） */
  abbr: string;
  /** 标签颜色类 */
  colorClass: string;
  /** 背景色类 */
  bgClass: string;
}

const entityTypeStyles: Record<string, EntityTypeStyle> = {
  power_system: {
    abbr: "力",
    colorClass: "text-neon-purple",
    bgClass: "bg-neon-purple/10 border-neon-purple/20",
  },
  plot_pattern: {
    abbr: "剧",
    colorClass: "text-neon-cyan",
    bgClass: "bg-neon-cyan/10 border-neon-cyan/20",
  },
  character_archetype: {
    abbr: "人",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10 border-amber-500/20",
  },
  worldview: {
    abbr: "观",
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
  },
  chapter_structure: {
    abbr: "章",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10 border-blue-500/20",
  },
};

const defaultStyle: EntityTypeStyle = {
  abbr: "元",
  colorClass: "text-muted-foreground",
  bgClass: "bg-muted/50 border-border",
};

// ============ 子组件 ============

/** 来源模式类型标签 */
function PatternTypeBadge({ entityType }: { entityType: string }) {
  const style = entityTypeStyles[entityType] || defaultStyle;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "w-5 h-5 rounded text-xs font-bold",
        "border shrink-0",
        style.bgClass,
        style.colorClass
      )}
    >
      {style.abbr}
    </span>
  );
}

/** 单个来源模式项 */
function PatternItem({ pattern }: { pattern: SourcePatternBrief }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <PatternTypeBadge entityType={pattern.entity_type} />
      <span className="text-sm text-foreground/80 truncate">
        {pattern.name}
      </span>
    </div>
  );
}

/** 来源模式列表 */
function SourcePatternsList({
  patterns,
  maxDisplay = 3,
}: {
  patterns: SourcePatternBrief[];
  maxDisplay?: number;
}) {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        暂无来源模式
      </div>
    );
  }

  const displayPatterns = patterns.slice(0, maxDisplay);
  const remainingCount = patterns.length - maxDisplay;

  return (
    <div className="space-y-1.5">
      {displayPatterns.map((pattern) => (
        <PatternItem key={pattern.id} pattern={pattern} />
      ))}
      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors pl-7 cursor-default">
              +{remainingCount} 更多
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              {patterns.slice(maxDisplay).map((pattern) => (
                <div key={pattern.id} className="flex items-center gap-2">
                  <PatternTypeBadge entityType={pattern.entity_type} />
                  <span className="text-xs">{pattern.name}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ============ 主组件 ============

interface FusionTaskCardProps {
  task: FusionTaskListWithPatterns;
  modeName: string;
  onEdit?: (taskId: string) => void;
  onDelete?: (task: FusionTaskListWithPatterns) => void;
}

export function FusionTaskCard({
  task,
  modeName,
  onEdit,
  onDelete,
}: FusionTaskCardProps) {
  return (
    <Link href={`/fusion/${task.id}`} className="block group">
      <Card className="bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col relative overflow-hidden cursor-pointer h-full">
        {/* 微光装饰线 - 仅在 hover 时显示 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* 任务 ID */}
            <span className="font-mono text-xs text-muted-foreground tracking-wider">
              #{task.id.slice(0, 8)}
            </span>

            {/* 状态 + 操作菜单 */}
            <div className="flex items-center gap-2">
              <FusionStatusBadge status={task.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit?.(task.id);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete?.(task);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* 元信息行：模式 + 方案数 + 时间 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              {modeName}
            </Badge>
            {task.candidate_count > 0 && (
              <span className="text-xs text-muted-foreground">
                {task.candidate_count} 个方案
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatTimeAgo(task.created_at)}
            </span>
          </div>

          {/* 来源模式区域 */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                融合来源
              </span>
              <span className="text-xs text-muted-foreground/60">
                ({task.source_patterns?.length ?? 0})
              </span>
            </div>
            <div className="pl-0.5">
              <SourcePatternsList
                patterns={task.source_patterns ?? []}
                maxDisplay={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
