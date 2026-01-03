"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
import {
  BookOpen,
  ChevronLeft,
  FileText,
  Users,
  Earth,
  Zap,
  GitBranch,
  Bookmark,
  Sparkles,
  MoreHorizontal,
  Download,
  Trash2,
  Loader2,
  Network,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProjectStatusBadge } from "@/components/common/status-badge";
import { StatCard, StatCardHorizontal } from "@/components/common/stat-card";
import {
  type Project,
  type Chapter,
  type GoldenFinger,
  projectTypeLabels,
} from "@/types/project";

import {
  useProject,
  useProjectChapters,
  useProjectGoldenFingers,
} from "@/hooks/use-projects";
import { useAnalysisStats } from "@/hooks/use-analysis-results";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    isLoading: isChaptersLoading,
  } = useProjectChapters(projectId, { limit: 100 }); // Initially load 100, needing pagination in future

  const {
    data: goldenFingersData,
    isLoading: isGoldenFingersLoading,
  } = useProjectGoldenFingers(projectId, { limit: 100 });

  const { stats, isLoading: isStatsLoading } = useAnalysisStats(projectId);

  const chapters = chaptersData?.items ?? [];
  const goldenFingers = goldenFingersData?.items ?? [];

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
                {project.total_chapters} 章 · {stats.characters} 角色 · {stats.worldview} 世界观设定
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.status === "completed" && (
              <>
                <Button variant="outline">
                  <GitBranch className="mr-2 h-4 w-4" />
                  创建续写
                </Button>
                <Button variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  提取元素
                </Button>
              </>
            )}
            {project.status === "draft" && (
              <Button className="glow-green">
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
            <TabsTrigger value="characters">角色</TabsTrigger>
            <TabsTrigger value="worldview">世界观</TabsTrigger>
            <TabsTrigger value="golden-fingers">金手指</TabsTrigger>
            <TabsTrigger value="plotlines">剧情线</TabsTrigger>
            <TabsTrigger value="foreshadowing">伏笔</TabsTrigger>
          </TabsList>

          {/* 概览 Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {isStatsLoading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                <>
                  <StatCard title="章节" value={project.total_chapters} icon={FileText} />
                  <StatCard title="角色" value={stats.characters} icon={Users} />
                  <StatCard title="世界观" value={stats.worldview} icon={Earth} />
                  <StatCard title="金手指" value={stats.goldenFingers} icon={Zap} />
                  <StatCard title="剧情线" value={stats.plotlines} icon={GitBranch} />
                  <StatCard title="伏笔" value={stats.foreshadowing} icon={Bookmark} />
                </>
              )}
            </div>

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

            {/* 快捷入口 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href={`/characters?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看角色"
                  value={stats.characters}
                  icon={Users}
                  description={`${stats.characters} 个角色`}
                />
              </Link>
              <Link href={`/worldview?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看世界观"
                  value={stats.worldview}
                  icon={Earth}
                  description={`${stats.worldview} 个设定`}
                />
              </Link>
              <Link href={`/storylines?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看剧情线"
                  value={stats.plotlines}
                  icon={GitBranch}
                  description={`${stats.plotlines} 条剧情线`}
                />
              </Link>
              <Link href={`/relations?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看关系网络"
                  value={stats.characters}
                  icon={Network}
                  description="角色关系图"
                />
              </Link>
            </div>
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
                      {chapter.number}
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

          {/* 角色 Tab */}
          <TabsContent value="characters">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  请前往{" "}
                  <Link
                    href={`/characters?novel=${project.id}`}
                    className="text-primary hover:underline"
                  >
                    人物图谱
                  </Link>{" "}
                  查看完整角色列表
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 世界观 Tab */}
          <TabsContent value="worldview">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Earth className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  请前往{" "}
                  <Link
                    href={`/worldview?novel=${project.id}`}
                    className="text-primary hover:underline"
                  >
                    世界观
                  </Link>{" "}
                  查看完整设定
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 金手指 Tab */}
          <TabsContent value="golden-fingers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goldenFingers.map((gf) => (
                <Card key={gf.id} className="bg-card/50 border-border/50 hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        {gf.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono">
                        Lv.{gf.level}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {gf.type}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* API 列表接口暂不返回详细信息，如需展示详情需单独获取 */}

                    <div className="py-4 text-center text-sm text-muted-foreground">
                      点击查看详情
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      查看状态历史
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 剧情线 Tab */}
          <TabsContent value="plotlines">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  请前往{" "}
                  <Link
                    href={`/storylines?novel=${project.id}`}
                    className="text-primary hover:underline"
                  >
                    剧情大纲
                  </Link>{" "}
                  查看完整剧情线
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 伏笔 Tab */}
          <TabsContent value="foreshadowing">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bookmark className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  伏笔追踪功能即将上线
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
