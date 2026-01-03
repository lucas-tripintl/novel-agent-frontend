"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMultiProjectEntities } from "@/hooks/use-analysis-results";
import { useProjects, getProjectColor } from "@/hooks/use-projects";
import type { EntityRead } from "@/types/api";

// 关系类型配置
type RelationType = "lover" | "enemy" | "ally" | "family" | "master" | "friend" | "other";

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
  other: {
    label: "其他",
    icon: Users,
    color: "#6b7280",
    bgColor: "bg-gray-500/20",
  },
};

// 关系类型映射
const relationTypeMap: Record<string, RelationType> = {
  lover: "lover",
  恋人: "lover",
  恋爱: "lover",
  爱人: "lover",
  道侣: "lover",
  enemy: "enemy",
  敌人: "enemy",
  敌对: "enemy",
  仇人: "enemy",
  对手: "enemy",
  ally: "ally",
  盟友: "ally",
  同盟: "ally",
  伙伴: "ally",
  family: "family",
  亲属: "family",
  亲人: "family",
  兄弟: "family",
  姐妹: "family",
  父母: "family",
  子女: "family",
  master: "master",
  师徒: "master",
  师父: "master",
  徒弟: "master",
  师傅: "master",
  friend: "friend",
  朋友: "friend",
  友人: "friend",
  好友: "friend",
};

// 角色节点
interface CharacterNode {
  id: string;
  name: string;
  avatar: string;
  projectId: string;
  projectColor: string;
  description: string;
  x: number;
  y: number;
}

// 关系边
interface Relation {
  from: string;
  to: string;
  type: RelationType;
  label: string;
}

// 从实体中提取角色和关系
function extractCharactersAndRelations(
  entities: EntityRead[],
  projectsMap: Map<string, { name: string; color: string }>
): { nodes: CharacterNode[]; relations: Relation[] } {
  const nodes: CharacterNode[] = [];
  const relations: Relation[] = [];
  const nodeMap = new Map<string, CharacterNode>();

  entities.forEach((entity, index) => {
    let content: Record<string, unknown> = {};
    try {
      content = JSON.parse(entity.content);
    } catch {
      content = {};
    }

    const project = projectsMap.get(entity.project_id);
    const projectColor = project?.color || getProjectColor(entity.project_id);

    // 创建节点
    const node: CharacterNode = {
      id: entity.id,
      name: entity.name,
      avatar: entity.name[0] || "?",
      projectId: entity.project_id,
      projectColor,
      description: (content.description as string) || entity.content.slice(0, 100),
      // 使用圆形布局
      x: 50 + 35 * Math.cos((2 * Math.PI * index) / Math.max(entities.length, 1)),
      y: 50 + 35 * Math.sin((2 * Math.PI * index) / Math.max(entities.length, 1)),
    };

    nodes.push(node);
    nodeMap.set(entity.id, node);
    nodeMap.set(entity.name.toLowerCase(), node);

    // 提取关系
    const rawRelations = (content.relations as Array<{ name: string; type: string }>) ||
                        (content.relationships as Array<{ name: string; type: string }>) || [];

    rawRelations.forEach((rel) => {
      if (rel.name && rel.type) {
        const typeKey = rel.type.toLowerCase();
        const relationType = relationTypeMap[typeKey] || "other";

        relations.push({
          from: entity.id,
          to: rel.name.toLowerCase(), // 暂时用名字，后面会匹配
          type: relationType,
          label: rel.type,
        });
      }
    });
  });

  // 匹配关系中的目标节点
  const validRelations: Relation[] = [];
  relations.forEach((rel) => {
    const toNode = nodeMap.get(rel.to);
    if (toNode) {
      validRelations.push({
        ...rel,
        to: toNode.id,
      });
    }
  });

  // 去重（A->B 和 B->A 保留一个）
  const seenPairs = new Set<string>();
  const uniqueRelations = validRelations.filter((rel) => {
    const pair1 = `${rel.from}-${rel.to}`;
    const pair2 = `${rel.to}-${rel.from}`;
    if (seenPairs.has(pair1) || seenPairs.has(pair2)) {
      return false;
    }
    seenPairs.add(pair1);
    return true;
  });

  return { nodes, relations: uniqueRelations };
}

export default function RelationsPage() {
  const [selectedNovels, setSelectedNovels] = useState<string[]>([]);
  const [selectedRelationType, setSelectedRelationType] = useState<string>("all");
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterNode | null>(null);
  const [zoom, setZoom] = useState(1);

  // 获取项目列表
  const { data: projectsData } = useProjects();
  const projectsMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    projectsData?.items?.forEach((p) => {
      map.set(p.id, { name: p.name, color: getProjectColor(p.id) });
    });
    return map;
  }, [projectsData?.items]);

  // 获取角色实体
  const { entities, isLoading, error } = useMultiProjectEntities(
    selectedNovels,
    "character",
    { enabled: selectedNovels.length > 0 }
  );

  // 提取节点和关系
  const { nodes: characterNodes, relations } = useMemo(
    () => extractCharactersAndRelations(entities, projectsMap),
    [entities, projectsMap]
  );

  // 过滤节点和关系
  const filteredNodes = characterNodes;
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
            autoSelectFirst
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

        {/* 加载状态 */}
        {isLoading && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <Skeleton className="h-[500px] w-full" />
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">加载关系数据失败，请稍后重试</span>
            </CardContent>
          </Card>
        )}

        {/* 未选择项目提示 */}
        {!isLoading && selectedNovels.length === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Network className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">请选择小说</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                选择一本或多本小说以查看人物关系网络
              </p>
            </CardContent>
          </Card>
        )}

        {/* 关系图 */}
        {!isLoading && !error && selectedNovels.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* 关系图区域 */}
            <Card className="bg-card/30 border-border/50 overflow-hidden">
              <CardContent className="p-0 relative">
                {filteredNodes.length > 0 ? (
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
                                  backgroundColor: `${node.projectColor}20`,
                                  color: node.projectColor,
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-[500px]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Search className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">暂无关系数据</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      所选小说暂无角色关系数据，请先进行分析
                    </p>
                  </div>
                )}

                {/* 提示 */}
                {filteredNodes.length > 0 && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <Info className="h-3 w-3" />
                    点击节点查看详情，再次点击取消选中
                  </div>
                )}
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
                  {relationStats.filter((s) => s.count > 0).map((stat) => {
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
                  {relationStats.every((s) => s.count === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      暂无关系数据
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 小说来源图例 */}
              {selectedNovels.length > 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">小说来源</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Array.from(
                      new Map(
                        filteredNodes.map((n) => [
                          n.projectId,
                          { id: n.projectId, color: n.projectColor },
                        ])
                      ).values()
                    ).map((novel) => {
                      const project = projectsMap.get(novel.id);
                      return (
                        <div key={novel.id} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: novel.color }}
                          />
                          <span className="text-sm">{project?.name || novel.id}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* 选中人物信息 */}
              {selectedCharacter && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback
                          className="text-xs"
                          style={{
                            backgroundColor: `${selectedCharacter.projectColor}20`,
                            color: selectedCharacter.projectColor,
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
                                      backgroundColor: `${otherNode.projectColor}20`,
                                      color: otherNode.projectColor,
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
                      {filteredRelations.filter(
                        (r) =>
                          r.from === selectedCharacter.id ||
                          r.to === selectedCharacter.id
                      ).length === 0 && (
                        <p className="text-xs text-muted-foreground">暂无关系</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
