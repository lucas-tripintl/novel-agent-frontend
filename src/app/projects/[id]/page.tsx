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

// 模拟项目数据
const mockProject: Project = {
  id: "1",
  name: "斗破苍穹",
  type: "original",
  status: "completed",
  progress: 100,
  totalChapters: 1648,
  analyzedChapters: 1648,
  stats: {
    characters: 342,
    worldview: 128,
    goldenFingers: 5,
    plotlines: 24,
    foreshadowing: 89,
  },
  createdAt: "2024-01-10",
  updatedAt: "2024-01-15",
};

// 模拟章节数据
const mockChapters: Chapter[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  projectId: "1",
  number: i + 1,
  title: `第${i + 1}章 ${["陨落的天才", "斗之气", "纳戒", "魂力", "炎帝", "药老", "云岚宗", "萧薰儿", "斗技", "修炼"][i % 10]}`,
  wordCount: Math.floor(Math.random() * 3000) + 2000,
  summary: i % 3 === 0 ? "本章主角萧炎展开修炼，实力有所提升..." : undefined,
  analyzed: i < 15,
}));

// 模拟金手指数据
const mockGoldenFingers: GoldenFinger[] = [
  {
    id: "1",
    projectId: "1",
    name: "药老",
    type: "导师系统",
    level: 9,
    description: "沉睡在纳戒中的上古药王强者，指导主角修炼",
    abilities: ["炼药指导", "战斗辅助", "知识传授"],
    resources: {
      "地火": "异火榜第十九",
      "药典": "上古药方",
    },
  },
  {
    id: "2",
    projectId: "1",
    name: "异火",
    type: "能力系统",
    level: 10,
    description: "天地间的奇异火焰，可用于炼药和战斗",
    abilities: ["青莲地心火", "陨落心炎", "海心焰"],
    resources: {
      "异火数量": 6,
      "最高排名": 3,
    },
  },
  {
    id: "3",
    projectId: "1",
    name: "吞噬",
    type: "特殊体质",
    level: 8,
    description: "可以吞噬他人异火为己用",
    abilities: ["吞噬融合", "火焰控制", "温度免疫"],
  },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [statusFilter, setStatusFilter] = useState("all");

  // 实际项目中应该从 API 获取数据
  const project = mockProject;
  const chapters = mockChapters;
  const goldenFingers = mockGoldenFingers;

  const filteredChapters = chapters.filter((ch) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "analyzed") return ch.analyzed;
    if (statusFilter === "pending") return !ch.analyzed;
    return true;
  });

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
                {project.totalChapters} 章 · {project.stats.characters} 角色 · {project.stats.worldview} 世界观设定
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
              <StatCard title="章节" value={project.totalChapters} icon={FileText} />
              <StatCard title="角色" value={project.stats.characters} icon={Users} />
              <StatCard title="世界观" value={project.stats.worldview} icon={Earth} />
              <StatCard title="金手指" value={project.stats.goldenFingers} icon={Zap} />
              <StatCard title="剧情线" value={project.stats.plotlines} icon={GitBranch} />
              <StatCard title="伏笔" value={project.stats.foreshadowing} icon={Bookmark} />
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
                    <span>第 {project.currentChapter} 章 / 共 {project.totalChapters} 章</span>
                    <span className="font-mono text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </CardContent>
              </Card>
            )}

            {/* 快捷入口 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href={`/characters?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看角色"
                  value={project.stats.characters}
                  icon={Users}
                  description={`${project.stats.characters} 个角色`}
                />
              </Link>
              <Link href={`/worldview?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看世界观"
                  value={project.stats.worldview}
                  icon={Earth}
                  description={`${project.stats.worldview} 个设定`}
                />
              </Link>
              <Link href={`/storylines?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看剧情线"
                  value={project.stats.plotlines}
                  icon={GitBranch}
                  description={`${project.stats.plotlines} 条剧情线`}
                />
              </Link>
              <Link href={`/relations?novel=${project.id}`}>
                <StatCardHorizontal
                  title="查看关系网络"
                  value={project.stats.characters}
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
                  {project.analyzedChapters}/{project.totalChapters} 已分析
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
                      {chapter.wordCount.toLocaleString()} 字
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
                    <p className="text-sm text-muted-foreground">{gf.description}</p>

                    {gf.abilities.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">当前能力</Label>
                        <div className="flex flex-wrap gap-1">
                          {gf.abilities.map((ability) => (
                            <Badge key={ability} variant="outline" className="text-xs">
                              {ability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {gf.resources && Object.keys(gf.resources).length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">资源</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(gf.resources).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between bg-muted/30 rounded px-2 py-1"
                            >
                              <span className="text-xs">{key}</span>
                              <span className="font-mono text-xs text-primary">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
