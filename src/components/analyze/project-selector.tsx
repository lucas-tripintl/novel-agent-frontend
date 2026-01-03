"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Search,
} from "lucide-react";
import { listProjects } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import type { ProjectList, ProjectStatus } from "@/types/api";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "completed", label: "已完成" },
  { value: "in_progress", label: "分析中" },
  { value: "draft", label: "草稿" },
  { value: "paused", label: "已暂停" },
];

interface ProjectSelectorProps {
  onSelect: (project: ProjectList) => void;
  selectedId?: string;
}

export function ProjectSelector({ onSelect, selectedId }: ProjectSelectorProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", "for-analyze", statusFilter, page],
    queryFn: () =>
      listProjects({
        status: statusFilter === "all" ? undefined : statusFilter,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
  });

  // 客户端搜索过滤（作品名）
  const filteredProjects = (data?.items ?? []).filter((p) =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  // 重置分页当筛选条件变化
  const handleStatusChange = (value: string) => {
    setStatusFilter(value as ProjectStatus | "all");
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 过滤器 */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索作品名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 !h-8 bg-background/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger size="sm" className="w-auto min-w-[90px] bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 列表内容 */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/30 !py-0 !gap-0">
                <CardContent className="p-2.5 !px-3 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-card/30 border-dashed !py-0 !gap-0 h-full">
            <CardContent className="flex flex-col items-center justify-center h-full">
              <FileText className="h-6 w-6 text-destructive/50 mb-2" />
              <p className="text-sm text-muted-foreground">加载失败</p>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-card/30 border-dashed !py-0 !gap-0 h-full">
            <CardContent className="flex flex-col items-center justify-center h-full">
              <BookOpen className="h-6 w-6 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all" ? "未找到匹配的作品" : "暂无作品"}
              </p>
              {!search && statusFilter === "all" && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  上传文件开始分析
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-full -mr-3 pr-3">
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={project.id === selectedId}
                  onSelect={() => onSelect(project)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/30 shrink-0">
          <span className="text-xs text-muted-foreground">
            共 {total} 部作品
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectList;
  isSelected: boolean;
  onSelect: () => void;
}

function ProjectCard({ project, isSelected, onSelect }: ProjectCardProps) {
  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    draft: { label: "草稿", variant: "outline" },
    in_progress: { label: "分析中", variant: "secondary" },
    completed: { label: "已完成", variant: "default" },
    paused: { label: "已暂停", variant: "outline" },
  };

  const status = statusConfig[project.status] || {
    label: project.status,
    variant: "outline" as const,
  };

  return (
    <Card
      className={cn(
        "bg-card/50 cursor-pointer transition-all hover:bg-card/70 !py-0 !gap-0",
        isSelected && "ring-2 ring-primary bg-card/70"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-2.5 !px-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium truncate">{project.name}</span>
              <Badge variant={status.variant} className="shrink-0 text-xs">
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{project.total_chapters} 章</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-colors shrink-0",
              isSelected && "text-primary"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
