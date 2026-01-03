"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Command,
  CommandInput,
} from "@/components/ui/command";
import {
  FileText,
  BookOpen,
  Zap,
  TrendingUp,
  AlertTriangle,
  Star,
  Search,
  AlertCircle,
  Flag,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCrossProjectEntities } from "@/hooks/use-analysis-results";
import { useSelectedProjectIds } from "@/stores/project-selection-store";
import { useProjects, getProjectColor } from "@/hooks/use-projects";
import type { EntityRead } from "@/types/api";

// 情节类型
type PlotType = "setup" | "conflict" | "climax" | "resolution" | "twist" | "foreshadowing" | "default";

const plotTypeConfig: Record<
  PlotType,
  { label: string; icon: typeof Zap; color: string }
> = {
  setup: { label: "铺垫", icon: BookOpen, color: "text-muted-foreground" },
  conflict: { label: "冲突", icon: AlertTriangle, color: "text-orange-500" },
  climax: { label: "高潮", icon: Zap, color: "text-primary" },
  resolution: { label: "收尾", icon: TrendingUp, color: "text-green-500" },
  twist: { label: "反转", icon: Star, color: "text-purple-500" },
  foreshadowing: { label: "伏笔", icon: Flag, color: "text-cyan-500" },
  default: { label: "情节", icon: BookOpen, color: "text-muted-foreground" },
};

// 剧情数据结构
interface PlotPoint {
  id: string;
  title: string;
  type: PlotType;
  description: string;
  chapters: string;
  projectId: string;
  firstChapter?: number;
  lastChapter?: number;
}

// 从 EntityRead 解析剧情数据
function parsePlotlineEntity(entity: EntityRead): PlotPoint {
  let content: Record<string, unknown> = {};
  try {
    content = JSON.parse(entity.content);
  } catch {
    content = { description: entity.content };
  }

  const description = (content.description as string) ||
                     (content.summary as string) ||
                     entity.content.slice(0, 300);

  const typeStr = ((content.type as string) ||
                  (content.plot_type as string) ||
                  entity.tags[0] ||
                  "default").toLowerCase();

  const type = Object.keys(plotTypeConfig).includes(typeStr)
    ? (typeStr as PlotType)
    : "default";

  // 计算章节范围
  let chapters = "";
  if (entity.first_chapter && entity.last_chapter) {
    chapters = `${entity.first_chapter}-${entity.last_chapter}`;
  } else if (entity.first_chapter) {
    chapters = `${entity.first_chapter}`;
  }

  return {
    id: entity.id,
    title: entity.name,
    type,
    description,
    chapters,
    projectId: entity.project_id,
    firstChapter: entity.first_chapter,
    lastChapter: entity.last_chapter,
  };
}

export default function StorylinesPage() {
  // 使用全局项目选择状态
  const selectedNovels = useSelectedProjectIds();
  const [searchQuery, setSearchQuery] = useState("");

  // 获取项目列表（用于显示项目名称）
  const { data: projectsData } = useProjects();
  const projectsMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    projectsData?.items?.forEach((p) => {
      map.set(p.id, { name: p.name, color: getProjectColor(p.id) });
    });
    return map;
  }, [projectsData?.items]);

  // 获取剧情线实体（使用新的跨项目 API）
  const { data, isLoading, error } = useCrossProjectEntities(
    selectedNovels,
    {
      entity_type: "plotline",
      enabled: selectedNovels.length > 0,
    }
  );
  const entities = data?.items ?? [];

  // 解析并按项目分组
  const plotsByProject = useMemo(() => {
    const parsed = entities.map(parsePlotlineEntity);

    // 搜索过滤
    const filtered = searchQuery
      ? parsed.filter(
          (plot) =>
            plot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plot.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : parsed;

    // 按项目分组
    const grouped = new Map<string, PlotPoint[]>();
    filtered.forEach((plot) => {
      const existing = grouped.get(plot.projectId) || [];
      existing.push(plot);
      grouped.set(plot.projectId, existing);
    });

    // 每个项目内按章节排序
    grouped.forEach((plots) => {
      plots.sort((a, b) => (a.firstChapter || 0) - (b.firstChapter || 0));
    });

    return grouped;
  }, [entities, searchQuery]);

  // 统计
  const totalPlots = Array.from(plotsByProject.values()).reduce(
    (acc, plots) => acc + plots.length,
    0
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              剧情大纲
            </h1>
            <p className="text-muted-foreground mt-1">
              查看剧情线和关键情节点
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {plotsByProject.size} 本小说
            </Badge>
            <Badge variant="outline" className="font-mono">
              {totalPlots} 情节点
            </Badge>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          <NovelFilter autoSelectFirst />
          <div className="flex-1 max-w-sm">
            <Command className="rounded-lg border border-border/50 bg-card/50">
              <CommandInput
                placeholder="搜索剧情..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </Command>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Card className="bg-card/30">
                  <CardContent className="p-4 space-y-4">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-20 w-full" />
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">加载剧情数据失败，请稍后重试</span>
            </CardContent>
          </Card>
        )}

        {/* 未选择项目提示 */}
        {!isLoading && selectedNovels.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">请选择小说</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                选择一本或多本小说以查看其剧情大纲
              </p>
            </CardContent>
          </Card>
        )}

        {/* 剧情大纲 */}
        {!isLoading && !error && selectedNovels.length > 0 && (
          <div className="space-y-6">
            {Array.from(plotsByProject.entries()).map(([projectId, plots]) => {
              const project = projectsMap.get(projectId);
              if (!project) return null;

              return (
                <div key={projectId} className="space-y-4">
                  {/* 小说标题 */}
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-1 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <h2 className="text-lg font-semibold">{project.name}</h2>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {plots.length} 情节点
                    </Badge>
                  </div>

                  {/* 情节列表 */}
                  <Accordion type="multiple" className="space-y-3" defaultValue={[plots[0]?.id]}>
                    {plots.map((plot) => {
                      const config = plotTypeConfig[plot.type];
                      const PlotIcon = config.icon;

                      return (
                        <AccordionItem
                          key={plot.id}
                          value={plot.id}
                          className="border border-border/50 rounded-lg bg-card/30 px-4"
                        >
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-4 flex-1">
                              {/* 时间线节点 */}
                              <div
                                className="h-8 w-8 rounded-full border-2 bg-background flex items-center justify-center shrink-0"
                                style={{ borderColor: project.color }}
                              >
                                <PlotIcon
                                  className={cn("h-4 w-4", config.color)}
                                />
                              </div>

                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {plot.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs", config.color)}
                                  >
                                    {config.label}
                                  </Badge>
                                </div>
                                {plot.chapters && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    第 {plot.chapters} 章
                                  </p>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 pl-12">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {plot.description}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              );
            })}
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !error && selectedNovels.length > 0 && totalPlots === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">未找到匹配的剧情</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchQuery
                  ? "尝试调整搜索关键词"
                  : "所选小说暂无剧情数据，请先进行分析"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
