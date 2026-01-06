"use client";

import { useEffect } from "react";
import { Activity, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTasks, useCancelTask } from "@/hooks/use-tasks";
import { useTaskPanelState, useTaskPanelActions } from "@/stores/task-store";
import { TaskItem } from "./task-item";
import type { TaskRead } from "@/types/api";

/** 无活跃任务后多久自动最小化（毫秒） */
const MINIMIZE_DELAY = 10000;

interface TaskPanelProps {
  projectId: string | null;
  className?: string;
}

export function TaskPanel({ projectId, className }: TaskPanelProps) {
  const { isExpanded, isMinimized } = useTaskPanelState();
  const { toggleExpanded, setHasNewTask, setMinimized } = useTaskPanelActions();
  const { data, isLoading } = useTasks(projectId);
  const cancelMutation = useCancelTask();

  const tasks = data?.items ?? [];
  const activeTasks = tasks.filter(
    (t) => t.status === "queued" || t.status === "running"
  );
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "failed" || t.status === "cancelled"
  );
  const activeCount = activeTasks.length;

  // 10 秒无活跃任务后自动最小化
  useEffect(() => {
    if (activeCount > 0) {
      // 有活跃任务时，立即退出最小化
      setMinimized(false);
      return;
    }

    // 没有活跃任务，启动计时器
    const timer = setTimeout(() => {
      setMinimized(true);
    }, MINIMIZE_DELAY);

    return () => clearTimeout(timer);
  }, [activeCount, setMinimized]);

  // 处理取消任务
  const handleCancel = (taskId: string) => {
    cancelMutation.mutate(taskId);
  };

  // 处理重试（TODO: 需要根据任务类型重新提交）
  const handleRetry = (task: TaskRead) => {
    // TODO: 根据 task.job_type 和 task.meta 重新提交任务
    console.log("Retry task:", task);
  };

  // 展开时清除新任务标记
  const handleToggle = () => {
    toggleExpanded();
    if (!isExpanded) {
      setHasNewTask(false);
    }
  };

  // 点击圆形按钮恢复正常状态
  const handleMinimizedClick = () => {
    setMinimized(false);
    setHasNewTask(false);
  };

  // 没有项目时不显示
  if (!projectId) return null;

  // 最小化状态：圆形按钮
  if (isMinimized) {
    return (
      <div
        className={cn(
          "fixed bottom-4 left-4 z-50",
          "transition-all duration-300 ease-out",
          className
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimizedClick}
              className={cn(
                "h-12 w-12 rounded-full",
                "bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg",
                "hover:bg-card/80 hover:scale-105",
                "transition-all duration-200"
              )}
            >
              <Activity className="h-5 w-5 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>任务</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // 正常状态：完整面板
  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 w-80",
        "bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg overflow-hidden",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={handleToggle}>
        {/* 头部触发器 */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between px-4 py-3 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm text-foreground">任务</span>
              {activeCount > 0 && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                  {activeCount}
                </Badge>
              )}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* 展开内容 */}
        <CollapsibleContent>
          <Separator className="bg-border/50" />

          {/* 任务列表 */}
          <ScrollArea className="max-h-80">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                加载中...
              </div>
            ) : tasks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">暂无任务</p>
              </div>
            ) : (
              <div>
                {/* 进行中的任务 */}
                {activeTasks.length > 0 && (
                  <div>
                    {activeTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onCancel={() => handleCancel(task.id)}
                      />
                    ))}
                  </div>
                )}

                {/* 分隔线 */}
                {activeTasks.length > 0 && completedTasks.length > 0 && (
                  <Separator className="bg-border/50" />
                )}

                {/* 已完成的任务 */}
                {completedTasks.length > 0 && (
                  <div>
                    {completedTasks.slice(0, 5).map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onRetry={
                          task.status === "failed"
                            ? () => handleRetry(task)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
