"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  FileText,
  Users,
  Earth,
  Zap,
  GitBranch,
  Bookmark,
  MoreHorizontal,
  Download,
  Trash2,
  Loader2,
  Network,
  PenLine,
  MapPin,
  Shield,
  Sparkles,
  Package,
  Eye,
  Wand2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/common/stat-card";
import {
  projectTypeLabels,
} from "@/types/project";
import type { EntityType, EntityRead } from "@/types/api";

import {
  useProject,
  useProjectChapters,
} from "@/hooks/use-projects";
import { useEntitiesOverview } from "@/hooks/use-analysis-results";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 设定分类配置
const categoryConfig: {
  type: EntityType;
  label: string;
  icon: typeof Users;
  color: string;
  href: string;
}[] = [
  { type: "character", label: "人物角色", icon: Users, color: "text-blue-500", href: "/characters" },
  { type: "location", label: "地理区域", icon: MapPin, color: "text-green-500", href: "/worldview" },
  { type: "worldview", label: "世界观", icon: Earth, color: "text-cyan-500", href: "/worldview" },
  { type: "faction", label: "势力组织", icon: Shield, color: "text-orange-500", href: "/worldview" },
  { type: "power_system", label: "力量体系", icon: Sparkles, color: "text-purple-500", href: "/worldview" },
  { type: "item", label: "物品道具", icon: Package, color: "text-amber-500", href: "/worldview" },
  { type: "skill", label: "技能功法", icon: Zap, color: "text-red-500", href: "/worldview" },
  { type: "plotline", label: "剧情线", icon: FileText, color: "text-indigo-500", href: "/storylines" },
  { type: "foreshadowing", label: "伏笔悬念", icon: Eye, color: "text-pink-500", href: "/storylines" },
  { type: "golden_finger", label: "金手指", icon: Wand2, color: "text-yellow-500", href: "/worldview" },
];

// 解析实体内容
function parseEntityContent(entity: EntityRead): { name: string; description: string } {
  try {
    const content = JSON.parse(entity.content || "{}");
    return {
      name: entity.name || content.name || "未命名",
      description: content.description || content.content || "",
    };
  } catch {
    return {
      name: entity.name || "未命名",
      description: entity.content || "",
    };
  }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: project,
    isLoading: isProjectLoading,
    error: projectError,
  } = useProject(projectId);

  const {
    data: chaptersData,
  } = useProjectChapters(projectId);

  // 使用 useEntitiesOverview 获取所有设定信息
  const { stats, total: totalEntities, isLoading: isEntitiesLoading, entities } = useEntitiesOverview(
    [projectId],
    { enabled: !!projectId }
  );

  // 从 infinite query 结构提取章节列表
  const chapters = useMemo(() => {
    if (!chaptersData?.pages) return [];
    return chaptersData.pages.flatMap((page) => page.items);
  }, [chaptersData?.pages]);

  // 章节总数
  const totalChapters = chaptersData?.pages?.[0]?.total ?? 0;

  // 从已获取的实体中取最近的 6 个用于预览
  const recentEntities = useMemo(() => {
    if (!entities || entities.length === 0) return [];
    return [...entities]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6);
  }, [entities]);

  // 计算各分类的统计
  const categoryStats = categoryConfig.map((cat) => ({
    ...cat,
    count: stats[cat.type] || 0,
  }));

  // 找出最多的分类（用于进度条）
  const maxCount = Math.max(...categoryStats.map((c) => c.count), 1);

  const filteredChapters = chapters.filter((ch) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "analyzed") return ch.analyzed;
    if (statusFilter === "pending") return !ch.analyzed;
    return true;
  });

  if (isProjectLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9" />
              <div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-48 mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-6 gap-4 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (projectError || !project) {
    return (
      <MainLayout>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>无法获取项目信息，请稍后重试。</AlertDescription>
          </Alert>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/">返回作品中心</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const progress = project.total_chapters > 0
    ? Math.round((project.analyzed_chapters / project.total_chapters) * 100)
    : 0;

  // Use analyzed_chapters + 1 as approximation for current chapter if processing
  const currentChapter = project.analyzed_chapters + 1;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge variant="secondary">{projectTypeLabels[project.type]}</Badge>
                <ProjectStatusBadge status={project.status} />
              </div>
              <p className="text-muted-foreground mt-1">
                {project.total_chapters} 章 · {stats.character} 角色 · {stats.worldview} 世界观设定
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 核心入口：开始写作 */}
            <Button className="glow-primary" asChild>
              <Link href={`/write/${project.id}`}>
                <PenLine className="mr-2 h-4 w-4" />
                开始写作
              </Link>
            </Button>
            {project.status === "draft" && (
              <Button variant="outline">
                <Zap className="mr-2 h-4 w-4" />
                开始分析
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  导出设定
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除项目
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="chapters">章节</TabsTrigger>
          </TabsList>

          {/* 概览 Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* 分析进度（如果正在进行）*/}
            {project.status === "in_progress" && (
              <Card className="bg-card/50 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    正在分析
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>第 {currentChapter} 章 / 共 {project.total_chapters} 章</span>
                    <span className="font-mono text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            )}

            {/* 设定分类统计网格 */}
            {isEntitiesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {categoryStats.map((cat) => {
                  const Icon = cat.icon;
                  const percentage = (cat.count / maxCount) * 100;

                  return (
                    <Link key={cat.type} href={`${cat.href}?novel=${project.id}`}>
                      <Card className="bg-card/50 border-border/50 hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer group h-full">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-muted/50 ${cat.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {cat.count}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                            {cat.label}
                          </h3>
                          <Progress value={percentage} className="h-1 mt-2" />
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 最近设定预览 */}
            {recentEntities.length > 0 && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">最近设定</CardTitle>
                      <CardDescription>最新添加或更新的设定</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px] pr-4">
                    <div className="space-y-3">
                      {recentEntities.map((entity) => {
                        const parsed = parseEntityContent(entity);
                        const catConfig = categoryConfig.find((c) => c.type === entity.entity_type);
                        const Icon = catConfig?.icon || FileText;

                        return (
                          <div
                            key={entity.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className={`p-2 rounded-lg bg-background ${catConfig?.color || "text-muted-foreground"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">{parsed.name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {parsed.description || "暂无描述"}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {catConfig?.label || entity.entity_type}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* 快速导航 */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">快速导航</CardTitle>
                <CardDescription>跳转到各设定集页面查看详情</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <Link href={`/characters?novel=${project.id}`}>
                    <Button variant="outline" className="w-full justify-between h-auto py-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>人物图谱</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/worldview?novel=${project.id}`}>
                    <Button variant="outline" className="w-full justify-between h-auto py-3">
                      <div className="flex items-center gap-2">
                        <Earth className="h-4 w-4 text-cyan-500" />
                        <span>世界观</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/storylines?novel=${project.id}`}>
                    <Button variant="outline" className="w-full justify-between h-auto py-3">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-indigo-500" />
                        <span>剧情大纲</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/relations?novel=${project.id}`}>
                    <Button variant="outline" className="w-full justify-between h-auto py-3">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-pink-500" />
                        <span>关系网络</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 章节 Tab */}
          <TabsContent value="chapters" className="space-y-4">
            {/* 筛选 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {project.analyzed_chapters}/{project.total_chapters} 已分析
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="analyzed">已分析</SelectItem>
                    <SelectItem value="pending">待分析</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 章节列表 */}
            <div className="space-y-2">
              {filteredChapters.map((chapter) => (
                <Card
                  key={chapter.id}
                  className="bg-card/50 border-border/50 hover:border-primary/30 transition-all"
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="font-mono text-sm text-muted-foreground w-12">
                      {chapter.chapter_number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{chapter.title}</div>
                      {chapter.summary && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {chapter.summary}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      {chapter.word_count.toLocaleString()} 字
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        chapter.analyzed
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {chapter.analyzed ? "已分析" : "待分析"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>查看详情</DropdownMenuItem>
                        <DropdownMenuItem>重新分析</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
