"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Network,
  Heart,
  Swords,
  Users,
  HandHeart,
  Shield,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// 关系类型配置
type RelationType = "lover" | "enemy" | "ally" | "family" | "master" | "friend";

const relationTypeConfig: Record<
  RelationType,
  { label: string; icon: typeof Heart; color: string; bgColor: string }
> = {
  lover: {
    label: "恋人",
    icon: Heart,
    color: "#ec4899",
    bgColor: "bg-pink-500/20",
  },
  enemy: {
    label: "敌对",
    icon: Swords,
    color: "#ef4444",
    bgColor: "bg-red-500/20",
  },
  ally: {
    label: "盟友",
    icon: Shield,
    color: "#3b82f6",
    bgColor: "bg-blue-500/20",
  },
  family: {
    label: "亲属",
    icon: Users,
    color: "#f97316",
    bgColor: "bg-orange-500/20",
  },
  master: {
    label: "师徒",
    icon: HandHeart,
    color: "#a855f7",
    bgColor: "bg-purple-500/20",
  },
  friend: {
    label: "朋友",
    icon: Users,
    color: "#22c55e",
    bgColor: "bg-green-500/20",
  },
};

// 模拟关系数据
const characterNodes = [
  {
    id: "1",
    name: "萧炎",
    avatar: "萧",
    novelId: "1",
    novelTitle: "斗破苍穹",
    novelColor: "#22c55e",
    x: 50,
    y: 50,
    description: "主角，从废物成长为斗帝",
  },
  {
    id: "2",
    name: "萧薰儿",
    avatar: "薰",
    novelId: "1",
    novelTitle: "斗破苍穹",
    novelColor: "#22c55e",
    x: 20,
    y: 30,
    description: "古族圣女，萧炎的恋人",
  },
  {
    id: "3",
    name: "药尘",
    avatar: "药",
    novelId: "1",
    novelTitle: "斗破苍穹",
    novelColor: "#22c55e",
    x: 80,
    y: 30,
    description: "丹圣，萧炎的导师",
  },
  {
    id: "4",
    name: "云韵",
    avatar: "韵",
    novelId: "1",
    novelTitle: "斗破苍穹",
    novelColor: "#22c55e",
    x: 30,
    y: 70,
    description: "云岚宗弟子，萧炎红颜知己",
  },
  {
    id: "5",
    name: "美杜莎",
    avatar: "美",
    novelId: "1",
    novelTitle: "斗破苍穹",
    novelColor: "#22c55e",
    x: 70,
    y: 70,
    description: "蛇人族女王",
  },
  {
    id: "6",
    name: "云山",
    avatar: "云",
    novelId: "1",
    novelTitle: "斗破苍穹",
    novelColor: "#22c55e",
    x: 15,
    y: 55,
    description: "云岚宗宗主，萧炎仇人",
  },
  {
    id: "7",
    name: "叶凡",
    avatar: "叶",
    novelId: "2",
    novelTitle: "遮天",
    novelColor: "#a855f7",
    x: 50,
    y: 50,
    description: "主角，最终成为天帝",
  },
  {
    id: "8",
    name: "姬紫月",
    avatar: "姬",
    novelId: "2",
    novelTitle: "遮天",
    novelColor: "#a855f7",
    x: 25,
    y: 35,
    description: "紫月教圣女",
  },
  {
    id: "9",
    name: "黑皇",
    avatar: "黑",
    novelId: "2",
    novelTitle: "遮天",
    novelColor: "#a855f7",
    x: 75,
    y: 35,
    description: "大黑狗，叶凡的伙伴",
  },
];

const relations = [
  { from: "1", to: "2", type: "lover" as RelationType, label: "青梅竹马" },
  { from: "1", to: "3", type: "master" as RelationType, label: "恩师" },
  { from: "1", to: "4", type: "lover" as RelationType, label: "红颜知己" },
  { from: "1", to: "5", type: "lover" as RelationType, label: "契约" },
  { from: "1", to: "6", type: "enemy" as RelationType, label: "仇敌" },
  { from: "4", to: "6", type: "family" as RelationType, label: "宗门关系" },
  { from: "7", to: "8", type: "lover" as RelationType, label: "道侣" },
  { from: "7", to: "9", type: "friend" as RelationType, label: "损友" },
];

export default function RelationsPage() {
  const [selectedNovels, setSelectedNovels] = useState<string[]>(["1"]);
  const [selectedRelationType, setSelectedRelationType] = useState<string>("all");
  const [selectedCharacter, setSelectedCharacter] = useState<
    (typeof characterNodes)[0] | null
  >(null);
  const [zoom, setZoom] = useState(1);

  // 过滤节点和关系
  const filteredNodes = characterNodes.filter(
    (node) =>
      selectedNovels.length === 0 || selectedNovels.includes(node.novelId)
  );

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredRelations = relations.filter((rel) => {
    const nodesMatch =
      filteredNodeIds.has(rel.from) && filteredNodeIds.has(rel.to);
    const typeMatch =
      selectedRelationType === "all" || rel.type === selectedRelationType;
    return nodesMatch && typeMatch;
  });

  // 高亮相关节点
  const highlightedNodeIds = selectedCharacter
    ? new Set([
        selectedCharacter.id,
        ...filteredRelations
          .filter(
            (r) =>
              r.from === selectedCharacter.id || r.to === selectedCharacter.id
          )
          .flatMap((r) => [r.from, r.to]),
      ])
    : null;

  // 统计
  const relationStats = Object.entries(relationTypeConfig).map(
    ([type, config]) => ({
      type,
      ...config,
      count: filteredRelations.filter((r) => r.type === type).length,
    })
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              关系网络
            </h1>
            <p className="text-muted-foreground mt-1">
              可视化展示人物之间的关系网络
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {filteredNodes.length} 人物
            </Badge>
            <Badge variant="outline" className="font-mono">
              {filteredRelations.length} 关系
            </Badge>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 flex-wrap">
          <NovelFilter
            selectedIds={selectedNovels}
            onSelectionChange={setSelectedNovels}
          />
          <Select
            value={selectedRelationType}
            onValueChange={setSelectedRelationType}
          >
            <SelectTrigger className="w-[140px] bg-card/50 border-border/50">
              <SelectValue placeholder="关系类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部关系</SelectItem>
              {Object.entries(relationTypeConfig).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <config.icon
                      className="h-4 w-4"
                      style={{ color: config.color }}
                    />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          {/* 缩放控制 */}
          <div className="flex items-center gap-1 border border-border/50 rounded-lg p-1 bg-card/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(1)}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* 关系图区域 */}
          <Card className="bg-card/30 border-border/50 overflow-hidden">
            <CardContent className="p-0 relative">
              {/* 简化的关系图 */}
              <div
                className="relative w-full h-[500px] overflow-hidden bg-gradient-to-br from-background to-muted/20"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {/* SVG 连线层 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {filteredRelations.map((rel, index) => {
                    const fromNode = filteredNodes.find((n) => n.id === rel.from);
                    const toNode = filteredNodes.find((n) => n.id === rel.to);
                    if (!fromNode || !toNode) return null;

                    const config = relationTypeConfig[rel.type];
                    const isHighlighted =
                      !highlightedNodeIds ||
                      (highlightedNodeIds.has(rel.from) &&
                        highlightedNodeIds.has(rel.to));

                    return (
                      <g key={index}>
                        <line
                          x1={`${fromNode.x}%`}
                          y1={`${fromNode.y}%`}
                          x2={`${toNode.x}%`}
                          y2={`${toNode.y}%`}
                          stroke={config.color}
                          strokeWidth={isHighlighted ? 2 : 1}
                          strokeOpacity={isHighlighted ? 0.8 : 0.3}
                          strokeDasharray={rel.type === "enemy" ? "5,5" : "none"}
                        />
                        {/* 关系标签 */}
                        <text
                          x={`${(fromNode.x + toNode.x) / 2}%`}
                          y={`${(fromNode.y + toNode.y) / 2}%`}
                          textAnchor="middle"
                          dy="-5"
                          className="text-[10px] fill-muted-foreground"
                          style={{ opacity: isHighlighted ? 1 : 0.5 }}
                        >
                          {rel.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* 节点层 */}
                {filteredNodes.map((node) => {
                  const isHighlighted =
                    !highlightedNodeIds || highlightedNodeIds.has(node.id);
                  const isSelected = selectedCharacter?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      className={cn(
                        "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200",
                        !isHighlighted && "opacity-30"
                      )}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      onClick={() =>
                        setSelectedCharacter(isSelected ? null : node)
                      }
                    >
                      <div
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                          isSelected && "bg-primary/10 ring-2 ring-primary"
                        )}
                      >
                        <Avatar
                          className={cn(
                            "h-12 w-12 border-2 transition-all",
                            isSelected
                              ? "border-primary scale-110"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <AvatarFallback
                            className="text-lg font-bold"
                            style={{
                              backgroundColor: `${node.novelColor}20`,
                              color: node.novelColor,
                            }}
                          >
                            {node.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "text-xs font-medium whitespace-nowrap",
                            isSelected && "text-primary"
                          )}
                        >
                          {node.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 提示 */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                <Info className="h-3 w-3" />
                点击节点查看详情，再次点击取消选中
              </div>
            </CardContent>
          </Card>

          {/* 图例和统计 */}
          <div className="space-y-4">
            {/* 关系图例 */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">关系类型</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {relationStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn("p-1.5 rounded", stat.bgColor)}
                        >
                          <Icon
                            className="h-3 w-3"
                            style={{ color: stat.color }}
                          />
                        </div>
                        <span className="text-sm">{stat.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {stat.count}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 小说来源图例 */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">小说来源</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from(
                  new Map(
                    filteredNodes.map((n) => [
                      n.novelId,
                      { id: n.novelId, title: n.novelTitle, color: n.novelColor },
                    ])
                  ).values()
                ).map((novel) => (
                  <div key={novel.id} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: novel.color }}
                    />
                    <span className="text-sm">{novel.title}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 选中人物信息 */}
            {selectedCharacter && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback
                        className="text-xs"
                        style={{
                          backgroundColor: `${selectedCharacter.novelColor}20`,
                          color: selectedCharacter.novelColor,
                        }}
                      >
                        {selectedCharacter.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {selectedCharacter.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {selectedCharacter.description}
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      相关关系
                    </h4>
                    {filteredRelations
                      .filter(
                        (r) =>
                          r.from === selectedCharacter.id ||
                          r.to === selectedCharacter.id
                      )
                      .map((rel, index) => {
                        const otherId =
                          rel.from === selectedCharacter.id ? rel.to : rel.from;
                        const otherNode = filteredNodes.find(
                          (n) => n.id === otherId
                        );
                        if (!otherNode) return null;

                        const config = relationTypeConfig[rel.type];
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback
                                  className="text-[10px]"
                                  style={{
                                    backgroundColor: `${otherNode.novelColor}20`,
                                    color: otherNode.novelColor,
                                  }}
                                >
                                  {otherNode.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <span>{otherNode.name}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: config.color,
                                color: config.color,
                              }}
                            >
                              {rel.label}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 空状态 */}
        {filteredNodes.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">未找到匹配的人物</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                尝试选择其他小说以查看人物关系网络
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
