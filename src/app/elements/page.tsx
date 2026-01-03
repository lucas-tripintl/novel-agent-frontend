"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
} from "@/components/ui/command";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Library, Blend } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NovelFilter } from "@/components/common/novel-filter";
import { type Element, type ElementType, elementTypeLabels } from "@/types/element";

// 模拟元素数据
const mockElements: Element[] = [
  {
    id: "e1",
    name: "线性等级突破",
    type: "power_system",
    abstractPattern:
      "修炼体系按等级划分，每个等级有明确的实力标准，突破需要特定条件或资源",
    sourceProjects: [
      { id: "1", name: "斗破苍穹", color: "#22c55e" },
      { id: "2", name: "遮天", color: "#a855f7" },
    ],
    concreteExamples: [
      {
        id: "ex1",
        name: "斗之气等级",
        description: "从斗者到斗帝的九大境界",
        source: { id: "1", name: "斗破苍穹", color: "#22c55e" },
      },
      {
        id: "ex2",
        name: "修仙境界",
        description: "从炼气到大帝的修炼之路",
        source: { id: "2", name: "遮天", color: "#a855f7" },
      },
    ],
  },
  {
    id: "e2",
    name: "废柴逆袭原型",
    type: "character_archetype",
    abstractPattern:
      "主角起初被视为废物或天才陨落，后通过机遇觉醒隐藏能力，开启逆袭之路",
    sourceProjects: [
      { id: "1", name: "斗破苍穹", color: "#22c55e" },
      { id: "3", name: "完美世界", color: "#06b6d4" },
    ],
    concreteExamples: [
      {
        id: "ex3",
        name: "萧炎",
        description: "天才陨落后遇药老，重新崛起",
        source: { id: "1", name: "斗破苍穹", color: "#22c55e" },
      },
      {
        id: "ex4",
        name: "石昊",
        description: "至尊骨被夺，从废人成长为荒天帝",
        source: { id: "3", name: "完美世界", color: "#06b6d4" },
      },
    ],
  },
  {
    id: "e3",
    name: "势力争霸",
    type: "plot_pattern",
    abstractPattern:
      "主角通过加入或创建势力，在各大势力争霸中成长，最终成为最强势力领袖",
    sourceProjects: [
      { id: "1", name: "斗破苍穹", color: "#22c55e" },
      { id: "4", name: "凡人修仙传", color: "#f97316" },
    ],
    concreteExamples: [
      {
        id: "ex5",
        name: "迦南学院之争",
        description: "萧炎在迦南学院的成长与势力斗争",
        source: { id: "1", name: "斗破苍穹", color: "#22c55e" },
      },
      {
        id: "ex6",
        name: "修仙门派之争",
        description: "韩立在各大门派中的周旋与成长",
        source: { id: "4", name: "凡人修仙传", color: "#f97316" },
      },
    ],
  },
  {
    id: "e4",
    name: "多界穿梭",
    type: "worldview",
    abstractPattern: "存在多个空间/位面/世界，主角需要在不同世界间穿梭成长",
    sourceProjects: [
      { id: "2", name: "遮天", color: "#a855f7" },
      { id: "5", name: "诡秘之主", color: "#ec4899" },
    ],
    concreteExamples: [
      {
        id: "ex7",
        name: "九天十地",
        description: "遮天世界观中的多重天地设定",
        source: { id: "2", name: "遮天", color: "#a855f7" },
      },
      {
        id: "ex8",
        name: "序列世界",
        description: "诡秘之主中的多重隐秘世界",
        source: { id: "5", name: "诡秘之主", color: "#ec4899" },
      },
    ],
  },
  {
    id: "e5",
    name: "炼药/炼器体系",
    type: "power_system",
    abstractPattern:
      "通过炼制丹药或法器获得力量，形成独立于战斗的成长副线",
    sourceProjects: [
      { id: "1", name: "斗破苍穹", color: "#22c55e" },
      { id: "4", name: "凡人修仙传", color: "#f97316" },
    ],
    concreteExamples: [
      {
        id: "ex9",
        name: "炼药师",
        description: "斗破中的炼药体系和炼药师等级",
        source: { id: "1", name: "斗破苍穹", color: "#22c55e" },
      },
      {
        id: "ex10",
        name: "炼器师",
        description: "凡人中的炼器之道",
        source: { id: "4", name: "凡人修仙传", color: "#f97316" },
      },
    ],
  },
  {
    id: "e6",
    name: "宿命轮回",
    type: "plot_pattern",
    abstractPattern:
      "主角与命运/轮回抗争，涉及前世今生、因果循环等宏大主题",
    sourceProjects: [
      { id: "2", name: "遮天", color: "#a855f7" },
      { id: "3", name: "完美世界", color: "#06b6d4" },
    ],
    concreteExamples: [
      {
        id: "ex11",
        name: "无始大帝",
        description: "遮天中对命运的抗争与轮回之谜",
        source: { id: "2", name: "遮天", color: "#a855f7" },
      },
      {
        id: "ex12",
        name: "荒天帝",
        description: "完美世界中石昊对抗黑暗的宿命",
        source: { id: "3", name: "完美世界", color: "#06b6d4" },
      },
    ],
  },
];

export default function ElementsPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 筛选元素
  const filteredElements = mockElements.filter((element) => {
    // 来源筛选
    if (selectedSource) {
      const hasSource = element.sourceProjects.some((p) =>
        p.id === selectedSource
      );
      if (!hasSource) return false;
    }

    // 类型筛选
    if (typeFilter !== "all" && element.type !== typeFilter) {
      return false;
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        element.name.toLowerCase().includes(query) ||
        element.abstractPattern.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Library className="h-6 w-6 text-primary" />
            元素库
          </h1>
          <p className="text-muted-foreground mt-1">
            从已分析作品中提取的抽象模式，可用于融合创作
          </p>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* 来源项目筛选 */}
          <NovelFilter
            selectedId={selectedSource}
            onSelectionChange={setSelectedSource}
            useGlobalStore={false}
          />

          {/* 元素类型筛选 */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="元素类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="power_system">力量体系</SelectItem>
              <SelectItem value="plot_pattern">剧情模式</SelectItem>
              <SelectItem value="character_archetype">角色原型</SelectItem>
              <SelectItem value="worldview">世界观模式</SelectItem>
            </SelectContent>
          </Select>

          {/* 搜索 */}
          <div className="flex-1 max-w-sm">
            <Command className="rounded-lg border border-border/50 bg-card/50">
              <CommandInput
                placeholder="搜索元素..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </Command>
          </div>
        </div>

        {/* 元素网格 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredElements.map((element) => (
            <Card
              key={element.id}
              className="bg-card/50 border-border/50 hover:border-primary/30 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {elementTypeLabels[element.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    来自 {element.sourceProjects.length} 个项目
                  </span>
                </div>
                <CardTitle className="text-base">{element.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {element.abstractPattern}
                </p>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">具体案例</Label>
                  <div className="flex flex-wrap gap-2">
                    {element.concreteExamples.map((ex) => (
                      <HoverCard key={ex.id}>
                        <HoverCardTrigger>
                          <Badge variant="secondary" className="cursor-pointer">
                            {ex.name}
                          </Badge>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">{ex.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ex.description}
                            </p>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: ex.source.color,
                                color: ex.source.color,
                              }}
                            >
                              {ex.source.name}
                            </Badge>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/fusion/create?elements=${element.id}`}>
                    <Blend className="mr-2 h-4 w-4" />
                    用于融合
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 空状态 */}
        {filteredElements.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Library className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">没有找到匹配的元素</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                尝试调整筛选条件，或分析更多作品以提取元素
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
