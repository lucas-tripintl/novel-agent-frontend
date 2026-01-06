"use client";

import { Loader2, Check, X, RotateCcw, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskRead, TaskStatus, TaskJobType } from "@/types/api";

interface TaskItemProps {
  task: TaskRead;
  onCancel?: () => void;
  onRetry?: () => void;
  onNavigate?: () => void;
}

/** 任务类型中文映射 */
const JOB_TYPE_LABELS: Record<TaskJobType | string, string> = {
  write_chapter: "写作章节",
  generate_outline: "生成章纲",
  generate_novel_outline: "生成总纲",
  generate_volume_outline: "生成卷纲",
  generate_chapter_outline: "生成细纲",
  analysis: "分析章节",
  analyze_with_extraction: "综合拆书",
  fusion_pipeline: "融合流水线",
  extract_patterns: "提取模式",
  explore_idea: "探索点子",
};

/** 状态徽章配置 */
const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  queued: { label: "排队中", variant: "outline" },
  running: { label: "执行中", variant: "default" },
  completed: { label: "已完成", variant: "secondary" },
  failed: { label: "失败", variant: "destructive" },
  cancelled: { label: "已取消", variant: "secondary" },
};

/** 格式化相对时间 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
}

export function TaskItem({ task, onCancel, onRetry, onNavigate }: TaskItemProps) {
  const isActive = task.status === "queued" || task.status === "running";
  const isFailed = task.status === "failed";
  const isCompleted = task.status === "completed";
  const statusConfig = STATUS_CONFIG[task.status];
  const jobLabel = JOB_TYPE_LABELS[task.job_type] || task.job_type;

  return (
    <div
      className={cn(
        "px-4 py-3 transition-colors",
        isActive && "bg-primary/5",
        !isActive && "hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* 左侧：状态图标 + 内容 */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* 状态图标 */}
          <div className="mt-0.5 shrink-0">
            {isActive && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            {isCompleted && (
              <Check className="h-4 w-4 text-muted-foreground" />
            )}
            {isFailed && <X className="h-4 w-4 text-destructive" />}
            {task.status === "cancelled" && (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  isActive && "text-primary",
                  isFailed && "text-destructive",
                  !isActive && !isFailed && "text-muted-foreground"
                )}
              >
                {jobLabel}
              </span>
              <Badge variant={statusConfig.variant} className="text-[10px]">
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {task.message || formatRelativeTime(task.updated_at)}
            </p>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="shrink-0">
          {isActive && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {isFailed && onRetry && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          {isCompleted && onNavigate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
