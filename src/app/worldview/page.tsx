"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  CommandInput,
} from "@/components/ui/command";
import {
  Earth,
  MapPin,
  Shield,
  Sparkles,
  Search,
  Layers,
  AlertCircle,
  Package,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCrossProjectMultiTypeEntities } from "@/hooks/use-analysis-results";
import { useSelectedProjectId } from "@/stores/project-selection-store";
import { getProjectColor } from "@/hooks/use-projects";
import type { EntityType, EntityRead } from "@/types/api";

// 世界观相关的实体类型
const WORLDVIEW_ENTITY_TYPES: EntityType[] = [
  "location",
  "faction",
  "power_system",
  "worldview",
  "item",
  "skill",
];

// 分类配置
const categoryConfig: Record<string, {
  label: string;
  icon: typeof MapPin;
  entityTypes: EntityType[];
}> = {
  geography: {
    label: "地理区域",
    icon: MapPin,
    entityTypes: ["location"],
  },
  forces: {
    label: "势力组织",
    icon: Shield,
    entityTypes: ["faction"],
  },
  powerSystems: {
    label: "力量体系",
    icon: Sparkles,
    entityTypes: ["power_system"],
  },
  worldview: {
    label: "世界观设定",
    icon: Earth,
    entityTypes: ["worldview"],
  },
  items: {
    label: "物品道具",
    icon: Package,
    entityTypes: ["item"],
  },
  skills: {
    label: "技能功法",
    icon: Zap,
    entityTypes: ["skill"],
  },
};

// 解析实体内容（content 是 JSON 字符串）
function parseEntityContent(entity: EntityRead): {
  name: string;
  description: string;
  details: string;
} {
  try {
    const content = JSON.parse(entity.content);
    return {
      name: entity.name,
      description: content.description || content.summary || entity.name,
      details: content.details || content.description || JSON.stringify(content, null, 2),
    };
  } catch {
    return {
      name: entity.name,
      description: entity.content.slice(0, 100),
      details: entity.content,
    };
  }
}

export default function WorldviewPage() {
  // 使用全局项目选择状态
  const selectedProjectId = useSelectedProjectId();
  const [searchQuery, setSearchQuery] = useState("");

  // 获取多种类型的实体（使用新的跨项目 API）
  const { entitiesByType, isLoading, error } = useCrossProjectMultiTypeEntities(
    selectedProjectId ? [selectedProjectId] : [],
    WORLDVIEW_ENTITY_TYPES,
    { enabled: !!selectedProjectId }
  );

  // 按分类组织数据
  const categories = useMemo(() => {
    return Object.entries(categoryConfig).map(([id, config]) => {
      // 收集该分类下所有实体类型的数据
      const entities = config.entityTypes.flatMap(
        (type) => entitiesByType[type] || []
      );

      // 搜索过滤
      const filteredEntities = searchQuery
        ? entities.filter((entity) => {
            const parsed = parseEntityContent(entity);
            const query = searchQuery.toLowerCase();
            return (
              parsed.name.toLowerCase().includes(query) ||
              parsed.description.toLowerCase().includes(query)
            );
          })
        : entities;

      return {
        id,
        ...config,
        entities: filteredEntities,
      };
    });
  }, [entitiesByType, searchQuery]);

  const totalSettings = categories.reduce((acc, cat) => acc + cat.entities.length, 0);

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
          <NovelFilter autoSelectFirst />
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

        {/* 加载状态 */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/30">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-24 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">加载设定数据失败，请稍后重试</span>
            </CardContent>
          </Card>
        )}

        {/* 未选择项目提示 */}
        {!isLoading && !selectedProjectId && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Earth className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">请选择小说</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                选择一本小说以查看其世界观设定
              </p>
            </CardContent>
          </Card>
        )}

        {/* 设定分类 */}
        {!isLoading && !error && selectedProjectId && (
          <Accordion
            type="multiple"
            defaultValue={Object.keys(categoryConfig)}
            className="space-y-4"
          >
            {categories.map((category) => {
              if (category.entities.length === 0) return null;

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
                        {category.entities.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {category.entities.map((entity) => {
                        const parsed = parseEntityContent(entity);
                        const projectColor = getProjectColor(entity.project_id);

                        return (
                          <HoverCard key={entity.id} openDelay={200}>
                            <HoverCardTrigger asChild>
                              <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                                      {parsed.name}
                                    </CardTitle>
                                    <Badge
                                      variant="outline"
                                      className="text-xs shrink-0"
                                      style={{
                                        borderColor: projectColor,
                                        color: projectColor,
                                      }}
                                    >
                                      {entity.tags[0] || entity.entity_type}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {parsed.description}
                                  </p>
                                  {entity.first_chapter && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      首次出现: 第 {entity.first_chapter} 章
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            </HoverCardTrigger>
                            <HoverCardContent
                              className="w-80"
                              align="start"
                              side="right"
                            >
                              <div className="space-y-2">
                                <h4 className="font-semibold">{parsed.name}</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {parsed.details.slice(0, 500)}
                                  {parsed.details.length > 500 && "..."}
                                </p>
                                {entity.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-2">
                                    {entity.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: projectColor }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {entity.source_type === "extracted" ? "AI 提取" : "手动添加"}
                                  </span>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* 空状态 */}
        {!isLoading && !error && selectedProjectId && totalSettings === 0 && (
          <Card className="bg-card/30 border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">未找到匹配的设定</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchQuery
                  ? "尝试调整搜索关键词"
                  : "所选小说暂无世界观设定，请先进行分析"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
