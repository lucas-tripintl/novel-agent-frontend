"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { FusionTaskEditSheet } from "@/components/fusion/fusion-task-edit-sheet";
import { FusionTaskCard } from "@/components/fusion/fusion-task-card";
import { Blend, Plus, AlertCircle, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useFusionTasks, useFusionModes, useDeleteFusionTask } from "@/hooks/use-fusion";
import type { FusionTaskListWithPatterns } from "@/types/fusion";

export default function FusionPage() {
  const t = useTranslations("fusion");
  const tCommon = useTranslations("common");

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<FusionTaskListWithPatterns | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFusionTasks({ limit: 50 });

  const { data: modesData } = useFusionModes();
  const deleteTaskMutation = useDeleteFusionTask();

  const tasks = tasksData?.items ?? [];

  // 前端搜索过滤（按任务 ID 或融合模式搜索）
  const filteredTasks = useMemo(() => {
    const items = tasksData?.items ?? [];
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (t) =>
        t.id.toLowerCase().includes(query) ||
        t.fusion_mode.toLowerCase().includes(query)
    );
  }, [tasksData?.items, searchQuery]);

  const handleEditClick = (taskId: string) => {
    setTaskToEdit(taskId);
    setEditSheetOpen(true);
  };

  const handleDeleteClick = (task: FusionTaskListWithPatterns) => {
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
    if (!Array.isArray(modesData)) return mode;
    const modeInfo = modesData.find((m) => m.mode === mode);
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
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("description")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="glow-green">
              <Link href="/fusion/create">
                <Plus className="mr-2 h-4 w-4" />
                {t("create")}
              </Link>
            </Button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          {tasksData && (
            <span className="text-sm text-muted-foreground font-mono">
              {t("total", { count: filteredTasks.length })}
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
                <h3 className="font-semibold text-destructive">{t("loadFailed")}</h3>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : t("cannotLoadTasks")}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                {tCommon("retry")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 任务列表 */}
        {!isLoading && !isError && tasks.length > 0 && filteredTasks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <FusionTaskCard
                key={task.id}
                task={{
                  ...task,
                  source_patterns: task.source_patterns ?? [],
                }}
                modeName={getModeName(task.fusion_mode)}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        {/* 搜索无结果 */}
        {!isLoading && !isError && tasks.length > 0 && filteredTasks.length === 0 && (
          <EmptyState
            icon={Search}
            title={t("noMatchingTasks")}
            description={tCommon("tryDifferentKeywords")}
            action={{
              label: tCommon("clearSearch"),
              onClick: () => setSearchQuery(""),
              variant: "outline"
            }}
          />
        )}

        {/* 空状态 */}
        {!isLoading && !isError && tasks.length === 0 && (
          <EmptyState
            icon={Blend}
            title={t("empty")}
            description={t("emptyDescription")}
            action={{
              label: t("createTask"),
              onClick: () => {
                // This will be handled by the Link component
              },
              variant: "default"
            }}
          />
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
        targetName={taskToDelete ? t("deleteConfirm", { id: taskToDelete.id.slice(0, 8) }) : ""}
        onConfirm={handleDeleteConfirm}
        isPending={deleteTaskMutation.isPending}
      />
    </MainLayout>
  );
}
