"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  MapPin,
  Earth,
  Shield,
  Sparkles,
  Package,
  Zap,
  FileText,
  Eye,
  ArrowRight,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Network,
  Wand2,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useSelectedProjectIds } from "@/stores/project-selection-store";
import { useEntitiesOverview } from "@/hooks/use-analysis-results";
import { useProjects, getProjectColor } from "@/hooks/use-projects";
import type { EntityType, EntityRead } from "@/types/api";
import { useMemo } from "react";

// 设定分类配置
const categoryConfig: {
  type: EntityType;
  label: string;
  icon: typeof Users;
  color: string;
  href: string;
  description: string;
}[] = [
  {
    type: "character",
    label: "人物角色",
    icon: Users,
    color: "text-blue-500",
    href: "/characters",
    description: "主角、配角、反派等角色设定",
  },
  {
    type: "location",
    label: "地理区域",
    icon: MapPin,
    color: "text-green-500",
    href: "/worldview",
    description: "城市、地区、场所等地理设定",
  },
  {
    type: "worldview",
    label: "世界观",
    icon: Earth,
    color: "text-cyan-500",
    href: "/worldview",
    description: "背景设定、历史、规则等",
  },
  {
    type: "faction",
    label: "势力组织",
    icon: Shield,
    color: "text-orange-500",
    href: "/worldview",
    description: "门派、帮会、国家等组织",
  },
  {
    type: "power_system",
    label: "力量体系",
    icon: Sparkles,
    color: "text-purple-500",
    href: "/worldview",
    description: "修炼体系、等级划分等",
  },
  {
    type: "item",
    label: "物品道具",
    icon: Package,
    color: "text-amber-500",
    href: "/worldview",
    description: "装备、丹药、法宝等",
  },
  {
    type: "skill",
    label: "技能功法",
    icon: Zap,
    color: "text-red-500",
    href: "/worldview",
    description: "功法、技能、秘术等",
  },
  {
    type: "plotline",
    label: "剧情线",
    icon: FileText,
    color: "text-indigo-500",
    href: "/storylines",
    description: "主线、支线、伏笔等",
  },
  {
    type: "foreshadowing",
    label: "伏笔悬念",
    icon: Eye,
    color: "text-pink-500",
    href: "/storylines",
    description: "伏笔、悬念、铺垫等",
  },
  {
    type: "golden_finger",
    label: "金手指",
    icon: Wand2,
    color: "text-yellow-500",
    href: "/worldview",
    description: "主角外挂、系统等",
  },
];

// 解析实体内容
function parseEntityContent(entity: EntityRead): {
  name: string;
  description: string;
} {
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

export default function SettingsOverviewPage() {
  const selectedProjectIds = useSelectedProjectIds();

  // 获取项目列表（用于显示项目名称）
  const { data: projectsData } = useProjects();
  const projectsMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    projectsData?.items?.forEach((p) => {
      map.set(p.id, { name: p.name, color: getProjectColor(p.id) });
    });
    return map;
  }, [projectsData?.items]);

  // 获取设定统计和所有实体（一次请求获取全部）
  const { stats, total, isLoading, error, entities } = useEntitiesOverview(
    selectedProjectIds,
    { enabled: selectedProjectIds.length > 0 }
  );

  // 从已获取的实体中取最近的 6 个用于预览（按更新时间排序）
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              设定总览
            </h1>
            <p className="text-muted-foreground mt-1">
              查看所选项目的所有设定数据
            </p>
          </div>
        </div>

        {/* 项目选择器 */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <NovelFilter autoSelectFirst />
          </CardContent>
        </Card>

        {/* 未选择项目提示 */}
        {selectedProjectIds.length === 0 && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                请选择一个或多个项目查看设定
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                选择后将展示所有设定的统计和预览
              </p>
            </CardContent>
          </Card>
        )}

        {/* 加载中 */}
        {selectedProjectIds.length > 0 && isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">加载设定失败，请刷新重试</p>
            </CardContent>
          </Card>
        )}

        {/* 设定统计卡片 */}
        {selectedProjectIds.length > 0 && !isLoading && (
          <>
            {/* 总计统计 */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">总设定数</p>
                      <p className="text-3xl font-bold">{total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <BookOpen className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">已选项目</p>
                      <p className="text-3xl font-bold">{selectedProjectIds.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">设定类型</p>
                      <p className="text-3xl font-bold">
                        {categoryStats.filter((c) => c.count > 0).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 分类统计网格 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {categoryStats.map((cat) => {
                const Icon = cat.icon;
                const percentage = (cat.count / maxCount) * 100;

                return (
                  <Link key={cat.type} href={cat.href}>
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
                        <Progress
                          value={percentage}
                          className="h-1 mt-2"
                        />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* 最近添加的设定 */}
            {recentEntities.length > 0 && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">最近设定</CardTitle>
                      <CardDescription>各项目最新添加的设定</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {recentEntities.map((entity) => {
                        const parsed = parseEntityContent(entity);
                        const catConfig = categoryConfig.find(
                          (c) => c.type === entity.entity_type
                        );
                        const project = projectsMap.get(entity.project_id);
                        const Icon = catConfig?.icon || FileText;

                        return (
                          <div
                            key={entity.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className={`p-2 rounded-lg bg-background ${catConfig?.color || "text-muted-foreground"}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {parsed.name}
                                </span>
                                {project && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 shrink-0"
                                    style={{
                                      borderColor: project.color,
                                      color: project.color,
                                    }}
                                  >
                                    {project.name}
                                  </Badge>
                                )}
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
                  <Link href="/characters">
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>人物图谱</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/worldview">
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Earth className="h-4 w-4 text-cyan-500" />
                        <span>世界观</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/storylines">
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <span>剧情大纲</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/relations">
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                    >
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
          </>
        )}
      </div>
    </MainLayout>
  );
}

