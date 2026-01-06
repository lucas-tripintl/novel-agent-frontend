"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { FusionTaskEditSheet } from "@/components/fusion/fusion-task-edit-sheet";
import {
  Blend,
  Plus,
  ChevronRight,
  AlertCircle,
  MoreHorizontal,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { FusionStatusBadge } from "@/components/common/status-badge";
import { useFusionTasks, useFusionModes, useDeleteFusionTask } from "@/hooks/use-fusion";
import { formatTimeAgo } from "@/lib/utils/time";
import type { FusionTaskList } from "@/types/fusion";

export default function FusionPage() {
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<FusionTaskList | null>(null);

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFusionTasks({ limit: 20 });

  const { data: modesData } = useFusionModes();
  const deleteTaskMutation = useDeleteFusionTask();

  const tasks = tasksData?.items ?? [];

  const handleEditClick = (taskId: string) => {
    setTaskToEdit(taskId);
    setEditSheetOpen(true);
  };

  const handleDeleteClick = (task: FusionTaskList) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      await deleteTaskMutation.mutateAsync(taskToDelete.id);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  // 获取融合模式名称
  const getModeName = (mode: string) => {
    const modeInfo = modesData?.find((m) => m.mode === mode);
    return modeInfo?.name ?? mode;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Blend className="h-6 w-6 text-primary" />
              元素融合
            </h1>
            <p className="text-muted-foreground mt-1">
              将多本书的元素融合，创造全新设定
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="glow-green">
              <Link href="/fusion/create">
                <Plus className="mr-2 h-4 w-4" />
                新建融合
              </Link>
            </Button>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
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
                  {error instanceof Error ? error.message : "无法加载融合任务"}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                重试
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 任务列表 */}
        {!isLoading && !isError && tasks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{task.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <FusionStatusBadge status={task.status} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(task.id)}>
                            <Settings className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(task)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 源项目数量 */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {(task.source_pattern_count || task.source_project_count || 0)} 个源
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(task.created_at)}
                    </span>
                  </div>

                  {/* 融合模式 */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getModeName(task.fusion_mode)}
                    </Badge>
                    {task.candidate_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {task.candidate_count} 个方案
                      </span>
                    )}
                  </div>

                  {/* 操作 */}
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/fusion/${task.id}`}>
                        查看详情
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !isError && tasks.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Blend className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">还没有融合任务</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                选择多本已分析的书籍，创造全新的世界观和设定
              </p>
              <Button asChild className="glow-green">
                <Link href="/fusion/create">
                  <Plus className="mr-2 h-4 w-4" />
                  创建融合任务
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 编辑面板 */}
      <FusionTaskEditSheet
        taskId={taskToEdit}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        targetName={taskToDelete ? `融合任务 #${taskToDelete.id.slice(0, 8)}` : ""}
        onConfirm={handleDeleteConfirm}
        isPending={deleteTaskMutation.isPending}
      />
    </MainLayout>
  );
}
