"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { NovelFilter } from "@/components/common/novel-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Users,
  MapPin,
  Globe,
  Shield,
  Sparkles,
  Package,
  Zap,
  FileText,
  Eye,
  BookOpen,
  AlertCircle,
  Wand2,
  Layers,
  Search,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useCrossProjectEntities } from "@/hooks/use-analysis-results";
import { useSelectedProjectId } from "@/stores/project-selection-store";
import { useEnumStore } from "@/stores/enum-store";
import type { EntityType, EntityRead } from "@/types/api";

// 设定类型配置
const entityTypeConfig: Record<
  EntityType,
  { label: string; icon: typeof Users; color: string }
> = {
  character: { label: "人物角色", icon: Users, color: "text-blue-500" },
  location: { label: "地理区域", icon: MapPin, color: "text-green-500" },
  worldview: { label: "世界观", icon: Globe, color: "text-cyan-500" },
  faction: { label: "势力组织", icon: Shield, color: "text-orange-500" },
  power_system: { label: "力量体系", icon: Sparkles, color: "text-purple-500" },
  item: { label: "物品道具", icon: Package, color: "text-amber-500" },
  skill: { label: "技能功法", icon: Zap, color: "text-red-500" },
  plotline: { label: "剧情线", icon: FileText, color: "text-indigo-500" },
  foreshadowing: { label: "伏笔悬念", icon: Eye, color: "text-pink-500" },
  golden_finger: { label: "金手指", icon: Wand2, color: "text-yellow-500" },
  // 其他类型使用默认配置
  plot_pattern: { label: "剧情模式", icon: FileText, color: "text-slate-500" },
  character_archetype: { label: "角色原型", icon: Users, color: "text-slate-500" },
  conflict_pattern: { label: "冲突模式", icon: Zap, color: "text-slate-500" },
  narrative_rhythm: { label: "叙事节奏", icon: FileText, color: "text-slate-500" },
  chapter_structure: { label: "章节结构", icon: BookOpen, color: "text-slate-500" },
  relationship_dynamic: { label: "关系动态", icon: Users, color: "text-slate-500" },
  conflict_escalation: { label: "冲突升级", icon: Zap, color: "text-slate-500" },
  cheat_evolution: { label: "外挂进化", icon: Sparkles, color: "text-slate-500" },
  cool_point_pattern: { label: "爽点模式", icon: Sparkles, color: "text-slate-500" },
  writing_technique: { label: "写作技巧", icon: FileText, color: "text-slate-500" },
  golden_opening_report: { label: "黄金开头", icon: BookOpen, color: "text-slate-500" },
};

// 常用设定类型（用于过滤器选项）
const commonEntityTypes: EntityType[] = [
  "character",
  "location",
  "worldview",
  "faction",
  "power_system",
  "item",
  "skill",
  "plotline",
  "foreshadowing",
  "golden_finger",
];

// 每页显示数量
const PAGE_SIZE = 20;

/**
 * 简单的 Markdown 渲染组件
 */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag key={elements.length} className="my-2 pl-4">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 标题
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="text-base font-semibold mt-4 mb-2">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={i} className="text-xl font-bold mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    }
    // 无序列表
    else if (line.match(/^[-*]\s/)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(line.replace(/^[-*]\s/, ""));
    }
    // 有序列表
    else if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(line.replace(/^\d+\.\s/, ""));
    }
    // 空行
    else if (line.trim() === "") {
      flushList();
    }
    // 普通段落
    else {
      flushList();
      elements.push(
        <p key={i} className="my-2">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();
  return <>{elements}</>;
}

/**
 * 渲染行内 Markdown 元素
 */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const italicParts = part.split(/(\*[^*]+\*)/g);
    if (italicParts.length > 1) {
      return italicParts.map((iPart, iIdx) => {
        if (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length > 2) {
          return (
            <em key={`${idx}-${iIdx}`} className="italic">
              {iPart.slice(1, -1)}
            </em>
          );
        }
        return iPart;
      });
    }
    return part;
  });
}

/**
 * 解析实体内容为可读文本
 */
function parseEntityContent(entity: EntityRead): string {
  // 如果内容是纯文本，直接返回
  if (!entity.content.startsWith("{")) {
    return entity.content;
  }

  // 尝试解析 JSON
  try {
    const parsed = JSON.parse(entity.content);
    // 优先使用 description 或 content 字段
    if (parsed.description) return parsed.description;
    if (parsed.content) return parsed.content;
    if (parsed.summary) return parsed.summary;

    // 如果是对象，格式化输出
    const lines: string[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim()) {
        lines.push(`**${key}**: ${value}`);
      } else if (Array.isArray(value) && value.length > 0) {
        lines.push(`**${key}**:`);
        value.forEach((item) => {
          if (typeof item === "string") {
            lines.push(`- ${item}`);
          }
        });
      }
    }
    return lines.join("\n");
  } catch {
    return entity.content;
  }
}

/**
 * 获取设定类型配置
 */
function getEntityConfig(type: EntityType) {
  return (
    entityTypeConfig[type] || {
      label: type,
      icon: FileText,
      color: "text-muted-foreground",
    }
  );
}

export default function SettingsOverviewPage() {
  const selectedProjectId = useSelectedProjectId();
  const getLabel = useEnumStore((state) => state.getLabel);

  // 状态
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<EntityType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // 获取所有设定数据（不分页，前端处理）
  const { data, isLoading, error } = useCrossProjectEntities(
    selectedProjectId ? [selectedProjectId] : [],
    {
      entity_type: selectedType === "all" ? undefined : selectedType,
      keyword: searchQuery || undefined,
      limit: 1000, // 获取足够多的数据
      enabled: !!selectedProjectId,
    }
  );

  const entities = useMemo(() => data?.items ?? [], [data?.items]);

  // 按类型统计
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    entities.forEach((entity) => {
      stats[entity.entity_type] = (stats[entity.entity_type] || 0) + 1;
    });
    return stats;
  }, [entities]);

  // 过滤和分页
  const filteredEntities = useMemo(() => {
    let result = entities;

    // 搜索过滤（如果 API 没有处理的话，前端再过滤一次）
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [entities, searchQuery]);

  // 分页数据
  const paginatedEntities = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEntities.slice(start, start + PAGE_SIZE);
  }, [filteredEntities, currentPage]);

  const totalPages = Math.ceil(filteredEntities.length / PAGE_SIZE);

  // 全部展开/收起
  const handleExpandAll = useCallback(() => {
    setExpandedItems(paginatedEntities.map((e) => e.id));
  }, [paginatedEntities]);

  const handleCollapseAll = useCallback(() => {
    setExpandedItems([]);
  }, []);

  // 重置页码当过滤条件改变时
  const handleTypeChange = (value: string) => {
    setSelectedType(value as EntityType | "all");
    setCurrentPage(1);
    setExpandedItems([]);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setExpandedItems([]);
  };

  // 生成分页链接
  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // 显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // 显示部分页码
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

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
          {selectedProjectId && !isLoading && filteredEntities.length > 0 && (
            <Badge variant="outline" className="font-mono">
              共 {filteredEntities.length} 条设定
            </Badge>
          )}
        </div>

        {/* 项目选择器 */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <NovelFilter autoSelectFirst />
          </CardContent>
        </Card>

        {/* 未选择项目提示 */}
        {!selectedProjectId && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                请选择一个项目查看设定
              </p>
            </CardContent>
          </Card>
        )}

        {/* 主内容区 */}
        {selectedProjectId && (
          <>
            {/* 筛选栏 */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* 搜索框 */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索设定..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 类型过滤 */}
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    全部类型 ({entities.length})
                  </SelectItem>
                  {commonEntityTypes.map((type) => {
                    const config = getEntityConfig(type);
                    const count = typeStats[type] || 0;
                    if (count === 0 && selectedType !== type) return null;
                    return (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <config.icon className={cn("h-4 w-4", config.color)} />
                          {config.label} ({count})
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* 展开/收起按钮 */}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExpandAll}
                  disabled={
                    paginatedEntities.length === 0 ||
                    expandedItems.length === paginatedEntities.length
                  }
                >
                  <ChevronsUpDown className="h-4 w-4 mr-1" />
                  全部展开
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCollapseAll}
                  disabled={expandedItems.length === 0}
                >
                  <ChevronsDownUp className="h-4 w-4 mr-1" />
                  全部收起
                </Button>
              </div>
            </div>

            {/* 加载中 */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
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

            {/* 空状态 */}
            {!isLoading && !error && filteredEntities.length === 0 && (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    {searchQuery || selectedType !== "all"
                      ? "未找到匹配的设定"
                      : "该项目暂无设定数据"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 设定列表 */}
            {!isLoading && !error && paginatedEntities.length > 0 && (
              <Accordion
                type="multiple"
                value={expandedItems}
                onValueChange={setExpandedItems}
                className="space-y-3"
              >
                {paginatedEntities.map((entity) => {
                  const config = getEntityConfig(entity.entity_type);
                  const Icon = config.icon;
                  const content = parseEntityContent(entity);
                  const typeLabel =
                    getLabel("EntityType", entity.entity_type) || config.label;

                  return (
                    <AccordionItem
                      key={entity.id}
                      value={entity.id}
                      className="border border-border/50 rounded-lg bg-card/30 px-4 data-[state=open]:bg-card/50"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* 类型图标 */}
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0",
                              config.color
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* 名称和标签 */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold truncate">
                                {entity.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn("text-xs shrink-0", config.color)}
                              >
                                {typeLabel}
                              </Badge>
                              {entity.tags.slice(0, 2).map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {getLabel("CharacterRole", tag) ||
                                    getLabel("CharacterImportance", tag) ||
                                    tag}
                                </Badge>
                              ))}
                            </div>
                            {/* 章节范围 */}
                            {(entity.first_chapter || entity.last_chapter) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {entity.first_chapter && entity.last_chapter
                                  ? `第 ${entity.first_chapter}-${entity.last_chapter} 章`
                                  : entity.first_chapter
                                    ? `第 ${entity.first_chapter} 章`
                                    : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pl-12">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                          {content ? (
                            <MarkdownContent content={content} />
                          ) : (
                            <p className="italic">暂无内容</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  第 {currentPage} 页，共 {totalPages} 页
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={cn(
                          "cursor-pointer",
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                    {renderPaginationItems()}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={cn(
                          "cursor-pointer",
                          currentPage === totalPages &&
                            "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
