"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
function EmptyState() {
  return (
    <Card className="bg-card/30 border-dashed border-2 border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">还没有项目</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          上传你的第一本小说，开始智能拆书之旅
        </p>
        <Button asChild className="glow-green">
          <Link href="/analyze">
            <Plus className="mr-2 h-4 w-4" />
            上传小说
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// 错误状态组件
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="bg-card/30 border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">加载失败</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          无法获取项目列表，请检查网络连接后重试
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          重试
        </Button>
      </CardContent>
    </Card>
  );
}

// 项目卡片
function ProjectCard({
  project,
  onDelete,
}: {
  project: ProjectList;
  onDelete: (id: string) => void;
}) {
  const progress =
    project.total_chapters > 0
      ? Math.round((project.current_chapter / project.total_chapters) * 100)
      : 0;

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group overflow-hidden relative">
      {/* 顶部装饰线 - 科技感 */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* 背景网格纹理 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-4 relative">
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
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
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
            <span className="font-mono">{project.total_chapters} 章</span>
          </div>
        </div>

        {/* 进度条 - 分析中时显示 */}
        {project.status === "in_progress" && project.total_chapters > 0 && (
          <div className="mb-4">
            <Progress value={progress} className="h-1.5 bg-muted/50" />
            <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
              分析进度: {project.current_chapter}/{project.total_chapters}
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
              查看
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 h-9 text-xs bg-primary/90 hover:bg-primary glow-primary transition-all"
            asChild
          >
            <Link href={`/write/${project.id}`}>
              <PenLine className="mr-1.5 h-3.5 w-3.5" />
              创作
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardContent() {
  const { data, isLoading, isError, refetch } = useProjects({ limit: 20 });
  const deleteProjectMutation = useDeleteProject();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const projects = data?.items ?? [];

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      await deleteProjectMutation.mutateAsync(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">作品中心</h1>
          <p className="text-muted-foreground mt-1">管理你的作品</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/analyze">
              <Upload className="mr-2 h-4 w-4" />
              导入书籍
            </Link>
          </Button>
          <Button asChild className="glow-green">
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              新建作品
            </Link>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              作品数
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                data?.total ?? 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 作品列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            作品列表
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该项目及其所有数据，无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
