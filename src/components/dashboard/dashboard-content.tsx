"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { ProjectEditSheet } from "@/components/project/project-edit-sheet";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import {
  BookOpen,
  FileText,
  Plus,
  Upload,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  RefreshCw,
  Eye,
  PenLine,
  Settings,
  Search,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { projectTypeLabels, type ProjectType } from "@/types/project";
import { useProjects, useDeleteProject } from "@/hooks/use-projects";
import type { ProjectList } from "@/types/api";

// 项目类型徽章样式
const projectTypeBadgeStyles: Record<ProjectType, string> = {
  original: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  continuation: "bg-violet-500/20 text-violet-500 border-violet-500/30",
};

// 项目卡片骨架屏
function ProjectCardSkeleton() {
  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </Card>
  );
}

// 空状态组件
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <Card className="bg-card/30 border-dashed border-2 border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("empty")}</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          {t("emptyDescription")}
        </p>
        <Button asChild className="glow-green">
          <Link href="/analyze">
            <Plus className="mr-2 h-4 w-4" />
            {t("upload")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// 错误状态组件
function ErrorState({ onRetry, t, tCommon }: { onRetry: () => void; t: (key: string) => string; tCommon: (key: string) => string }) {
  return (
    <Card className="bg-card/30 border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{tCommon("loadFailed")}</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          {t("checkNetwork")}
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {tCommon("retry")}
        </Button>
      </CardContent>
    </Card>
  );
}

// 项目卡片
function ProjectCard({
  project,
  onDelete,
  onEdit,
  t,
  tCommon,
}: {
  project: ProjectList;
  onDelete: (id: string) => void;
  onEdit: (project: ProjectList) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}) {
  const progress =
    project.total_chapters > 0
      ? Math.round((project.current_chapter / project.total_chapters) * 100)
      : 0;

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 group overflow-hidden flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* 头部：标题 + 操作菜单 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {project.name}
          </h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Settings className="mr-2 h-4 w-4" />
                {tCommon("edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 徽章行 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${projectTypeBadgeStyles[project.project_type]}`}
          >
            {projectTypeLabels[project.project_type]}
          </Badge>

          {project.status !== "completed" && (
            <ProjectStatusBadge status={project.status} />
          )}

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
            <FileText className="h-3 w-3" />
            <span className="font-mono">{t("chapters", { count: project.total_chapters })}</span>
          </div>
        </div>

        {/* 进度条 - 分析中时显示 */}
        {project.status === "in_progress" && project.total_chapters > 0 && (
          <div className="mb-4">
            <Progress value={progress} className="h-1.5 bg-muted/50" />
            <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
              {t("analysisProgress")}: {project.current_chapter}/{project.total_chapters}
            </span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
            asChild
          >
            <Link href={`/projects/${project.id}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {tCommon("view")}
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 h-9 text-xs bg-primary/90 hover:bg-primary glow-primary transition-all"
            asChild
          >
            <Link href={`/write/${project.id}`}>
              <PenLine className="mr-1.5 h-3.5 w-3.5" />
              {t("write")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardContent() {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");

  const { data, isLoading, isError, refetch } = useProjects({ limit: 50 });
  const deleteProjectMutation = useDeleteProject();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectList | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectList | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const projects = data?.items ?? [];

  // 前端搜索过滤
  const filteredProjects = useMemo(() => {
    const items = data?.items ?? [];
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((p) => p.name.toLowerCase().includes(query));
  }, [data?.items, searchQuery]);

  const handleDeleteClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
      setDeleteDialogOpen(true);
    }
  };

  const handleEditClick = (project: ProjectList) => {
    setProjectToEdit(project);
    setEditSheetOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/analyze">
              <Upload className="mr-2 h-4 w-4" />
              {t("import")}
            </Link>
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="glow-green">
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
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
        {data && (
          <span className="text-sm text-muted-foreground font-mono">
            {t("total", { count: filteredProjects.length })}
          </span>
        )}
      </div>

      {/* 作品网格 */}
      {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} t={t} tCommon={tCommon} />
        ) : projects.length === 0 ? (
          <EmptyState t={t} />
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noMatchingProjects")}</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {tCommon("tryDifferentKeywords")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                {tCommon("clearSearch")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
                t={t}
                tCommon={tCommon}
              />
            ))}
          </div>
        )}

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        targetName={projectToDelete ? t("deleteConfirm", { name: projectToDelete.name }) : ""}
        onConfirm={handleDeleteConfirm}
        isPending={deleteProjectMutation.isPending}
      />

      {/* 项目编辑面板 */}
      <ProjectEditSheet
        project={projectToEdit}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />

      {/* 新建作品对话框 */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
