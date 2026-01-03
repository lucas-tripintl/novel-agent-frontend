"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
  Search,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// 情节类型
type PlotType = "setup" | "conflict" | "climax" | "resolution" | "twist";

const plotTypeConfig: Record<
  PlotType,
  { label: string; icon: typeof Zap; color: string }
> = {
  setup: { label: "铺垫", icon: BookOpen, color: "text-muted-foreground" },
  conflict: { label: "冲突", icon: AlertTriangle, color: "text-orange-500" },
  climax: { label: "高潮", icon: Zap, color: "text-primary" },
  resolution: { label: "收尾", icon: TrendingUp, color: "text-green-500" },
  twist: { label: "反转", icon: Star, color: "text-purple-500" },
};

// 模拟剧情数据
const storylineData = [
  {
    id: "1",
    novelId: "1",
    novelTitle: "斗破苍穹",
    novelColor: "#22c55e",
    volumes: [
      {
        id: "v1",
        name: "第一卷 废物少年",
        chapters: 50,
        analyzedChapters: 50,
        plots: [
          {
            id: "p1",
            title: "天才陨落",
            type: "setup" as PlotType,
            description: "萧炎从天才跌落谷底，被纳兰嫣然退婚",
            chapters: "1-10",
          },
          {
            id: "p2",
            title: "药老苏醒",
            type: "twist" as PlotType,
            description: "戒指中的药尘苏醒，成为萧炎的导师",
            chapters: "11-15",
          },
          {
            id: "p3",
            title: "斗气恢复",
            type: "climax" as PlotType,
            description: "萧炎修炼焚决，斗气开始恢复",
            chapters: "16-30",
          },
          {
            id: "p4",
            title: "家族比试",
            type: "conflict" as PlotType,
            description: "萧炎在家族比试中击败萧宁等人",
            chapters: "31-50",
          },
        ],
      },
      {
        id: "v2",
        name: "第二卷 魔兽山脉",
        chapters: 60,
        analyzedChapters: 60,
        plots: [
          {
            id: "p5",
            title: "进入山脉",
            type: "setup" as PlotType,
            description: "萧炎独自进入魔兽山脉历练",
            chapters: "51-60",
          },
          {
            id: "p6",
            title: "遭遇强敌",
            type: "conflict" as PlotType,
            description: "遇到云岚宗弟子和紫晶翼狮王",
            chapters: "61-80",
          },
          {
            id: "p7",
            title: "获得异火",
            type: "climax" as PlotType,
            description: "吞噬青莲地心火，实力大增",
            chapters: "81-100",
          },
          {
            id: "p8",
            title: "初见薰儿",
            type: "resolution" as PlotType,
            description: "与萧薰儿重逢，得知其真实身份",
            chapters: "101-110",
          },
        ],
      },
      {
        id: "v3",
        name: "第三卷 云岚宗",
        chapters: 80,
        analyzedChapters: 54,
        plots: [
          {
            id: "p9",
            title: "约战到来",
            type: "setup" as PlotType,
            description: "三年之约将至，萧炎返回加玛帝国",
            chapters: "111-130",
          },
          {
            id: "p10",
            title: "实力展示",
            type: "climax" as PlotType,
            description: "当众击败纳兰嫣然，证明自己",
            chapters: "131-150",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    novelId: "2",
    novelTitle: "遮天",
    novelColor: "#a855f7",
    volumes: [
      {
        id: "v1",
        name: "第一卷 九龙拉棺",
        chapters: 40,
        analyzedChapters: 40,
        plots: [
          {
            id: "p1",
            title: "泰山遇险",
            type: "setup" as PlotType,
            description: "叶凡在泰山遭遇神秘事件",
            chapters: "1-10",
          },
          {
            id: "p2",
            title: "九龙拉棺",
            type: "twist" as PlotType,
            description: "九条龙尸拉着铜棺穿越星空",
            chapters: "11-20",
          },
          {
            id: "p3",
            title: "流落北俱芦洲",
            type: "resolution" as PlotType,
            description: "众人被送往修仙世界",
            chapters: "21-40",
          },
        ],
      },
      {
        id: "v2",
        name: "第二卷 圣地风云",
        chapters: 60,
        analyzedChapters: 45,
        plots: [
          {
            id: "p4",
            title: "摇光圣子",
            type: "conflict" as PlotType,
            description: "叶凡与摇光圣地结下梁子",
            chapters: "41-60",
          },
          {
            id: "p5",
            title: "斩杀圣子",
            type: "climax" as PlotType,
            description: "叶凡展现惊人战力，斩杀圣子",
            chapters: "61-80",
          },
        ],
      },
    ],
  },
];

export default function StorylinesPage() {
  const [selectedNovels, setSelectedNovels] = useState<string[]>(["1"]);
  const [searchQuery, setSearchQuery] = useState("");

  // 过滤数据
  const filteredData = storylineData.filter((novel) => {
    return (
      selectedNovels.length === 0 || selectedNovels.includes(novel.novelId)
    );
  });

  // 统计
  const totalVolumes = filteredData.reduce(
    (acc, novel) => acc + novel.volumes.length,
    0
  );
  const totalPlots = filteredData.reduce(
    (acc, novel) =>
      acc + novel.volumes.reduce((vacc, vol) => vacc + vol.plots.length, 0),
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
              查看章节结构、剧情线和关键情节点
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {totalVolumes} 卷
            </Badge>
            <Badge variant="outline" className="font-mono">
              {totalPlots} 情节点
            </Badge>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          <NovelFilter
            selectedIds={selectedNovels}
            onSelectionChange={setSelectedNovels}
          />
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

        {/* 剧情大纲 */}
        <div className="space-y-6">
          {filteredData.map((novel) => (
            <div key={novel.id} className="space-y-4">
              {/* 小说标题 */}
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-1 rounded-full"
                  style={{ backgroundColor: novel.novelColor }}
                />
                <h2 className="text-lg font-semibold">{novel.novelTitle}</h2>
                <Badge variant="secondary" className="text-xs font-mono">
                  {novel.volumes.length} 卷
                </Badge>
              </div>

              {/* 卷列表 */}
              <Accordion type="multiple" className="space-y-3">
                {novel.volumes.map((volume) => {
                  const progress = Math.round(
                    (volume.analyzedChapters / volume.chapters) * 100
                  );
                  const filteredPlots = searchQuery
                    ? volume.plots.filter(
                        (plot) =>
                          plot.title
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          plot.description
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                      )
                    : volume.plots;

                  if (searchQuery && filteredPlots.length === 0) return null;

                  return (
                    <AccordionItem
                      key={volume.id}
                      value={volume.id}
                      className="border border-border/50 rounded-lg bg-card/30 px-4"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {volume.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs font-mono"
                              >
                                {volume.plots.length} 情节点
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>
                                {volume.analyzedChapters} / {volume.chapters} 章
                              </span>
                              <Progress value={progress} className="h-1 w-24" />
                              <span className="font-mono">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {/* 时间线样式的情节点 */}
                        <div className="relative pl-6 space-y-4">
                          {/* 时间线 */}
                          <div
                            className="absolute left-[9px] top-2 bottom-2 w-0.5 rounded-full"
                            style={{ backgroundColor: `${novel.novelColor}30` }}
                          />

                          {filteredPlots.map((plot, index) => {
                            const config = plotTypeConfig[plot.type];
                            const PlotIcon = config.icon;

                            return (
                              <div key={plot.id} className="relative">
                                {/* 时间线节点 */}
                                <div
                                  className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 bg-background flex items-center justify-center"
                                  style={{ borderColor: novel.novelColor }}
                                >
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor: novel.novelColor,
                                    }}
                                  />
                                </div>

                                {/* 情节卡片 */}
                                <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all ml-2">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold">
                                            {plot.title}
                                          </h4>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-xs",
                                              config.color
                                            )}
                                          >
                                            <PlotIcon className="h-3 w-3 mr-1" />
                                            {config.label}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {plot.description}
                                        </p>
                                      </div>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs font-mono shrink-0"
                                      >
                                        第 {plot.chapters} 章
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredData.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">未找到匹配的剧情</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                尝试选择其他小说或调整搜索关键词
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
