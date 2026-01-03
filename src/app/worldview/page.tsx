"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Earth,
  MapPin,
  Shield,
  Sparkles,
  Clock,
  Search,
  Layers,
} from "lucide-react";
import { useState } from "react";

// 模拟世界观数据
const worldviewData = {
  geography: [
    {
      id: "1",
      name: "斗气大陆",
      description: "以斗气为核心的修炼世界，分为中州、西北大陆等区域",
      source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
      details: "斗气大陆是一个以斗气修炼为主流的世界，强者如云，势力林立。大陆中央为中州，是整个大陆最强势力聚集之地。",
    },
    {
      id: "2",
      name: "加玛帝国",
      description: "斗破苍穹开篇萧炎所在的帝国，位于西北大陆",
      source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
      details: "加玛帝国是西北大陆的一个中等帝国，皇室与几大家族共治，云岚宗是帝国最强宗门。",
    },
    {
      id: "3",
      name: "北俱芦洲",
      description: "遮天世界九天十地之一，强者辈出的古老大陆",
      source: { id: "2", title: "遮天", color: "#a855f7" },
      details: "北俱芦洲是遮天世界的主要舞台，拥有众多圣地大教，曾出现过多位大帝。",
    },
  ],
  forces: [
    {
      id: "1",
      name: "云岚宗",
      description: "加玛帝国第一宗门，后被萧炎覆灭",
      source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
      details: "云岚宗是加玛帝国的顶级势力，宗主云山是斗皇强者，后因迫害萧炎被其覆灭。",
    },
    {
      id: "2",
      name: "魂殿",
      description: "斗气大陆最神秘的势力，收集灵魂炼制丹药",
      source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
      details: "魂殿是远古魂族在斗气大陆的代言人，表面上收购各种灵魂，暗地里图谋复活魂天帝。",
    },
    {
      id: "3",
      name: "荒古世家",
      description: "遮天世界中传承自太古的顶级势力",
      source: { id: "2", title: "遮天", color: "#a855f7" },
      details: "荒古世家是北俱芦洲最顶级的势力之一，传承自太古时期，底蕴深厚。",
    },
  ],
  powerSystems: [
    {
      id: "1",
      name: "斗气等级",
      description: "斗之气→斗者→斗师→大斗师→斗灵→斗王→斗皇→斗宗→斗尊→斗圣→斗帝",
      source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
      details: "斗气修炼体系共有十一个大等级，每个大等级分为初中高巅峰四个小等级，斗帝为最高境界。",
    },
    {
      id: "2",
      name: "修仙境界",
      description: "炼精化气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫",
      source: { id: "2", title: "遮天", color: "#a855f7" },
      details: "遮天的修炼体系结合了传统仙侠和创新，从炼精化气到大帝境界，每一步都艰难万分。",
    },
  ],
  history: [
    {
      id: "1",
      name: "远古时代",
      description: "斗帝强者尚存于世的时代，各族争锋",
      source: { id: "1", title: "斗破苍穹", color: "#22c55e" },
      details: "远古时代是斗帝强者活跃的时代，八族并立，最终魂天帝联合其他七族毁灭了炎族。",
    },
    {
      id: "2",
      name: "黑暗动乱",
      description: "无数大能陨落的灾难时代",
      source: { id: "2", title: "遮天", color: "#a855f7" },
      details: "黑暗动乱是遮天世界最恐怖的劫难，无数圣地覆灭，大帝陨落，起因是黑暗至尊的入侵。",
    },
  ],
};

const categories = [
  { id: "geography", label: "地理区域", icon: MapPin, data: worldviewData.geography },
  { id: "forces", label: "势力组织", icon: Shield, data: worldviewData.forces },
  { id: "powerSystems", label: "力量体系", icon: Sparkles, data: worldviewData.powerSystems },
  { id: "history", label: "历史事件", icon: Clock, data: worldviewData.history },
];

export default function WorldviewPage() {
  const [selectedNovels, setSelectedNovels] = useState<string[]>(["1"]);
  const [searchQuery, setSearchQuery] = useState("");

  // 过滤数据
  const filterData = <T extends { source: { id: string } }>(data: T[]) => {
    return data.filter((item) => {
      const matchesNovel =
        selectedNovels.length === 0 || selectedNovels.includes(item.source.id);
      return matchesNovel;
    });
  };

  // 搜索过滤
  const searchFilter = <T extends { name: string; description: string }>(
    data: T[]
  ) => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  };

  const totalSettings = categories.reduce((acc, cat) => {
    return acc + searchFilter(filterData(cat.data)).length;
  }, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Earth className="h-6 w-6 text-primary" />
              世界观
            </h1>
            <p className="text-muted-foreground mt-1">
              探索小说中的世界设定、地理、势力与力量体系
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              <Layers className="h-3 w-3 mr-1" />
              {totalSettings} 条设定
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
                placeholder="搜索设定..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </Command>
          </div>
        </div>

        {/* 设定分类 */}
        <Accordion
          type="multiple"
          defaultValue={["geography", "forces", "powerSystems", "history"]}
          className="space-y-4"
        >
          {categories.map((category) => {
            const filteredData = searchFilter(filterData(category.data));
            if (filteredData.length === 0) return null;

            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border border-border/50 rounded-lg bg-card/30 px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <category.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold">{category.label}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {filteredData.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredData.map((item) => (
                      <HoverCard key={item.id} openDelay={200}>
                        <HoverCardTrigger asChild>
                          <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base group-hover:text-primary transition-colors">
                                  {item.name}
                                </CardTitle>
                                <Badge
                                  variant="outline"
                                  className="text-xs shrink-0"
                                  style={{
                                    borderColor: item.source.color,
                                    color: item.source.color,
                                  }}
                                >
                                  {item.source.title}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            </CardContent>
                          </Card>
                        </HoverCardTrigger>
                        <HoverCardContent
                          className="w-80"
                          align="start"
                          side="right"
                        >
                          <div className="space-y-2">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.details}
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: item.source.color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                来源：{item.source.title}
                              </span>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* 空状态 */}
        {totalSettings === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">未找到匹配的设定</h3>
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
