"use client";

/**
 * 项目元素选择器
 * 支持：展开项目选择元素、项目/分类全选、搜索过滤、懒加载、虚拟滚动、元素预览
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useProjects } from "@/hooks/use-projects";
import {
  useProjectElements,
  elementCategories,
  groupEntitiesByCategory,
  getCategoryConfig,
} from "@/hooks/use-project-elements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronRight,
  Check,
  Loader2,
  User,
  Globe,
  Zap,
  Sparkles,
  MapPin,
  Flag,
  Package,
  Sword,
  GitBranch,
  Eye,
  Workflow,
  Users,
  Circle,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { EntityRead, EntityType, ProjectList } from "@/types/api";
import type { SelectedElement } from "@/types/fusion";

// 图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Globe,
  Zap,
  Sparkles,
  MapPin,
  Flag,
  Package,
  Sword,
  GitBranch,
  Eye,
  Workflow,
  Users,
  Circle,
};

interface ProjectElementSelectorProps {
  onSelectionChange: (elements: SelectedElement[]) => void;
  initialSelection?: SelectedElement[];
  minSelection?: number;
}

export function ProjectElementSelector({
  onSelectionChange,
  initialSelection = [],
  minSelection = 2,
}: ProjectElementSelectorProps) {
  // 获取项目列表
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects();
  const projects = projectsData?.items ?? [];

  // 状态管理
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedElements, setSelectedElements] = useState<
    Map<string, Set<string>>
  >(() => {
    const map = new Map<string, Set<string>>();
    initialSelection.forEach((el) => {
      if (!map.has(el.projectId)) {
        map.set(el.projectId, new Set());
      }
      map.get(el.projectId)!.add(el.entityId);
    });
    return map;
  });

  // 缓存所有加载的元素
  const [loadedEntities, setLoadedEntities] = useState<
    Map<string, EntityRead[]>
  >(new Map());

  // 计算已选元素总数
  const totalSelectedCount = useMemo(() => {
    let count = 0;
    selectedElements.forEach((set) => (count += set.size));
    return count;
  }, [selectedElements]);

  // 通知选择变化
  useEffect(() => {
    const elements: SelectedElement[] = [];
    selectedElements.forEach((entityIds, projectId) => {
      const entities = loadedEntities.get(projectId) || [];
      entityIds.forEach((entityId) => {
        const entity = entities.find((e) => e.id === entityId);
        if (entity) {
          elements.push({
            projectId,
            entityId,
            entityType: entity.entity_type,
            name: entity.name,
          });
        }
      });
    });
    onSelectionChange(elements);
  }, [selectedElements, loadedEntities, onSelectionChange]);

  // 切换项目展开
  const toggleProjectExpand = useCallback((projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  }, []);

  // 切换元素选择
  const toggleElement = useCallback(
    (projectId: string, entityId: string) => {
      setSelectedElements((prev) => {
        const newMap = new Map(prev);
        const projectSet = new Set(newMap.get(projectId) || []);

        if (projectSet.has(entityId)) {
          projectSet.delete(entityId);
        } else {
          projectSet.add(entityId);
        }

        if (projectSet.size === 0) {
          newMap.delete(projectId);
        } else {
          newMap.set(projectId, projectSet);
        }
        return newMap;
      });
    },
    []
  );

  // 项目全选/取消全选
  const toggleProjectSelectAll = useCallback(
    (projectId: string, entities: EntityRead[], select: boolean) => {
      setSelectedElements((prev) => {
        const newMap = new Map(prev);
        if (select) {
          const entityIds = new Set(entities.map((e) => e.id));
          newMap.set(projectId, entityIds);
        } else {
          newMap.delete(projectId);
        }
        return newMap;
      });
    },
    []
  );

  // 分类全选/取消全选
  const toggleCategorySelectAll = useCallback(
    (
      projectId: string,
      categoryEntities: EntityRead[],
      select: boolean,
      allProjectEntities: EntityRead[]
    ) => {
      setSelectedElements((prev) => {
        const newMap = new Map(prev);
        const projectSet = new Set(newMap.get(projectId) || []);
        const categoryIds = new Set(categoryEntities.map((e) => e.id));

        if (select) {
          categoryIds.forEach((id) => projectSet.add(id));
        } else {
          categoryIds.forEach((id) => projectSet.delete(id));
        }

        if (projectSet.size === 0) {
          newMap.delete(projectId);
        } else {
          newMap.set(projectId, projectSet);
        }
        return newMap;
      });
    },
    []
  );

  // 检查是否全选
  const isAllSelected = useCallback(
    (projectId: string, entities: EntityRead[]) => {
      const selected = selectedElements.get(projectId);
      if (!selected || entities.length === 0) return false;
      return entities.every((e) => selected.has(e.id));
    },
    [selectedElements]
  );

  // 检查是否部分选择
  const isPartiallySelected = useCallback(
    (projectId: string, entities: EntityRead[]) => {
      const selected = selectedElements.get(projectId);
      if (!selected) return false;
      const hasSelected = entities.some((e) => selected.has(e.id));
      const hasUnselected = entities.some((e) => !selected.has(e.id));
      return hasSelected && hasUnselected;
    },
    [selectedElements]
  );

  // 过滤后的项目（状态为 completed）
  const completedProjects = useMemo(() => {
    return projects.filter((p) => p.status === "completed");
  }, [projects]);

  if (isLoadingProjects) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索元素名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 bg-card/50"
          />
        </div>
        <Badge variant="outline" className="font-mono shrink-0">
          已选 {totalSelectedCount} 个元素
        </Badge>
      </div>

      {/* 项目列表 */}
      <Accordion
        type="multiple"
        value={expandedProjects}
        onValueChange={setExpandedProjects}
        className="space-y-3"
      >
        {completedProjects.map((project) => (
          <ProjectAccordionItem
            key={project.id}
            project={project}
            isExpanded={expandedProjects.includes(project.id)}
            searchKeyword={searchKeyword}
            selectedElements={selectedElements}
            loadedEntities={loadedEntities}
            setLoadedEntities={setLoadedEntities}
            toggleElement={toggleElement}
            toggleProjectSelectAll={toggleProjectSelectAll}
            toggleCategorySelectAll={toggleCategorySelectAll}
            isAllSelected={isAllSelected}
            isPartiallySelected={isPartiallySelected}
          />
        ))}
      </Accordion>

      {completedProjects.length === 0 && (
        <Card className="bg-card/30 border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">没有已完成分析的项目</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ 项目 Accordion Item ============

interface ProjectAccordionItemProps {
  project: ProjectList;
  isExpanded: boolean;
  searchKeyword: string;
  selectedElements: Map<string, Set<string>>;
  loadedEntities: Map<string, EntityRead[]>;
  setLoadedEntities: React.Dispatch<
    React.SetStateAction<Map<string, EntityRead[]>>
  >;
  toggleElement: (projectId: string, entityId: string) => void;
  toggleProjectSelectAll: (
    projectId: string,
    entities: EntityRead[],
    select: boolean
  ) => void;
  toggleCategorySelectAll: (
    projectId: string,
    categoryEntities: EntityRead[],
    select: boolean,
    allProjectEntities: EntityRead[]
  ) => void;
  isAllSelected: (projectId: string, entities: EntityRead[]) => boolean;
  isPartiallySelected: (projectId: string, entities: EntityRead[]) => boolean;
}

function ProjectAccordionItem({
  project,
  isExpanded,
  searchKeyword,
  selectedElements,
  loadedEntities,
  setLoadedEntities,
  toggleElement,
  toggleProjectSelectAll,
  toggleCategorySelectAll,
  isAllSelected,
  isPartiallySelected,
}: ProjectAccordionItemProps) {
  // 懒加载：只有展开时才获取元素
  const { data, isLoading, error } = useProjectElements(
    project.id,
    isExpanded
  );

  // 缓存加载的元素
  useEffect(() => {
    if (data?.items && data.items.length > 0) {
      setLoadedEntities((prev) => {
        const newMap = new Map(prev);
        newMap.set(project.id, data.items);
        return newMap;
      });
    }
  }, [data, project.id, setLoadedEntities]);

  const entities = loadedEntities.get(project.id) || data?.items || [];

  // 按分类分组（带搜索过滤）
  const groupedEntities = useMemo(
    () => groupEntitiesByCategory(entities, searchKeyword),
    [entities, searchKeyword]
  );

  // 过滤后的总数
  const filteredCount = useMemo(() => {
    let count = 0;
    groupedEntities.forEach((list) => (count += list.length));
    return count;
  }, [groupedEntities]);

  // 计算选中数量
  const selectedCount = selectedElements.get(project.id)?.size || 0;

  // 非空分类
  const nonEmptyCategories = useMemo(() => {
    return elementCategories.filter(
      (cat) => (groupedEntities.get(cat.type)?.length || 0) > 0
    );
  }, [groupedEntities]);

  const allFiltered = entities.filter((e) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      e.name.toLowerCase().includes(keyword) ||
      e.content?.toLowerCase().includes(keyword) ||
      e.tags?.some((t) => t.toLowerCase().includes(keyword))
    );
  });

  const projectAllSelected = isAllSelected(project.id, allFiltered);
  const projectPartiallySelected = isPartiallySelected(project.id, allFiltered);

  return (
    <AccordionItem
      value={project.id}
      className="border border-border/50 rounded-lg bg-card/30"
    >
      <AccordionTrigger className="hover:no-underline px-4 py-3">
        <div className="flex items-center justify-between flex-1 pr-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">{project.name}</span>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                已选 {selectedCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProjectSelectAll(
                    project.id,
                    allFiltered,
                    !projectAllSelected
                  );
                }}
              >
                {projectAllSelected ? (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    取消全选
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    全选
                  </>
                )}
              </Button>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              {filteredCount} 元素
            </Badge>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">加载元素中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            加载失败，请重试
          </div>
        ) : nonEmptyCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchKeyword ? "没有匹配的元素" : "暂无元素"}
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {nonEmptyCategories.map((cat) => {
              const catEntities = groupedEntities.get(cat.type) || [];
              return (
                <CategoryAccordionItem
                  key={cat.type}
                  projectId={project.id}
                  category={cat}
                  entities={catEntities}
                  allProjectEntities={allFiltered}
                  selectedElements={selectedElements}
                  toggleElement={toggleElement}
                  toggleCategorySelectAll={toggleCategorySelectAll}
                  isAllSelected={isAllSelected}
                  isPartiallySelected={isPartiallySelected}
                />
              );
            })}
          </Accordion>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ============ 分类 Accordion Item ============

interface CategoryAccordionItemProps {
  projectId: string;
  category: { type: EntityType; label: string; icon: string };
  entities: EntityRead[];
  allProjectEntities: EntityRead[];
  selectedElements: Map<string, Set<string>>;
  toggleElement: (projectId: string, entityId: string) => void;
  toggleCategorySelectAll: (
    projectId: string,
    categoryEntities: EntityRead[],
    select: boolean,
    allProjectEntities: EntityRead[]
  ) => void;
  isAllSelected: (projectId: string, entities: EntityRead[]) => boolean;
  isPartiallySelected: (projectId: string, entities: EntityRead[]) => boolean;
}

function CategoryAccordionItem({
  projectId,
  category,
  entities,
  allProjectEntities,
  selectedElements,
  toggleElement,
  toggleCategorySelectAll,
  isAllSelected,
  isPartiallySelected,
}: CategoryAccordionItemProps) {
  const Icon = iconMap[category.icon] || Circle;
  const categoryAllSelected = isAllSelected(projectId, entities);
  const categoryPartiallySelected = isPartiallySelected(projectId, entities);

  // 计算分类选中数
  const selectedInCategory = useMemo(() => {
    const selected = selectedElements.get(projectId);
    if (!selected) return 0;
    return entities.filter((e) => selected.has(e.id)).length;
  }, [selectedElements, projectId, entities]);

  return (
    <AccordionItem
      value={`${projectId}-${category.type}`}
      className="border border-border/30 rounded-md bg-background/50"
    >
      <AccordionTrigger className="hover:no-underline px-3 py-2">
        <div className="flex items-center justify-between flex-1 pr-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium">{category.label}</span>
            {selectedInCategory > 0 && (
              <Badge variant="secondary" className="font-mono text-[10px] h-5">
                {selectedInCategory}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategorySelectAll(
                  projectId,
                  entities,
                  !categoryAllSelected,
                  allProjectEntities
                );
              }}
            >
              {categoryAllSelected ? "取消" : "全选"}
            </Button>
            <Badge variant="outline" className="font-mono text-[10px]">
              {entities.length}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-3 pb-3">
        <VirtualElementList
          projectId={projectId}
          entities={entities}
          selectedElements={selectedElements}
          toggleElement={toggleElement}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

// ============ 虚拟滚动元素列表 ============

interface VirtualElementListProps {
  projectId: string;
  entities: EntityRead[];
  selectedElements: Map<string, Set<string>>;
  toggleElement: (projectId: string, entityId: string) => void;
}

function VirtualElementList({
  projectId,
  entities,
  selectedElements,
  toggleElement,
}: VirtualElementListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: entities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // 估计每行高度
    overscan: 5,
  });

  const selected = selectedElements.get(projectId) || new Set();

  // 如果元素少，不使用虚拟滚动
  if (entities.length <= 10) {
    return (
      <div className="space-y-1">
        {entities.map((entity) => (
          <ElementRow
            key={entity.id}
            entity={entity}
            isSelected={selected.has(entity.id)}
            onToggle={() => toggleElement(projectId, entity.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[400px] overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const entity = entities[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ElementRow
                entity={entity}
                isSelected={selected.has(entity.id)}
                onToggle={() => toggleElement(projectId, entity.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ 元素行（带预览） ============

interface ElementRowProps {
  entity: EntityRead;
  isSelected: boolean;
  onToggle: () => void;
}

function ElementRow({ entity, isSelected, onToggle }: ElementRowProps) {
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            isSelected
              ? "bg-primary/10 border border-primary/30"
              : "hover:bg-muted/50 border border-transparent"
          )}
          onClick={onToggle}
        >
          <Checkbox checked={isSelected} className="h-4 w-4" />
          <span className="text-sm flex-1 truncate">{entity.name}</span>
          {entity.tags && entity.tags.length > 0 && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {entity.tags[0]}
            </Badge>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-80 p-4"
        sideOffset={8}
      >
        <ElementPreview entity={entity} />
      </HoverCardContent>
    </HoverCard>
  );
}

// ============ 元素预览卡片 ============

interface ElementPreviewProps {
  entity: EntityRead;
}

function ElementPreview({ entity }: ElementPreviewProps) {
  const catConfig = getCategoryConfig(entity.entity_type);
  const Icon = iconMap[catConfig.icon] || Circle;

  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{entity.name}</h4>
          <p className="text-xs text-muted-foreground">{catConfig.label}</p>
        </div>
      </div>

      {/* 内容摘要 */}
      {entity.content && (
        <p className="text-sm text-muted-foreground line-clamp-4">
          {entity.content}
        </p>
      )}

      {/* 标签 */}
      {entity.tags && entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entity.tags.slice(0, 5).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {entity.tags.length > 5 && (
            <Badge variant="outline" className="text-[10px]">
              +{entity.tags.length - 5}
            </Badge>
          )}
        </div>
      )}

      {/* 章节范围 */}
      {(entity.first_chapter || entity.last_chapter) && (
        <div className="text-xs text-muted-foreground">
          出现章节: {entity.first_chapter || "?"} - {entity.last_chapter || "?"}
        </div>
      )}

      {/* 状态 */}
      <div className="flex items-center gap-2">
        <Badge
          variant={entity.status === "confirmed" ? "default" : "secondary"}
          className="text-[10px]"
        >
          {entity.status === "confirmed"
            ? "已确认"
            : entity.status === "pending"
            ? "待确认"
            : "已拒绝"}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {entity.source_type === "extracted"
            ? "自动提取"
            : entity.source_type === "manual"
            ? "手动添加"
            : "合并"}
        </Badge>
      </div>
    </div>
  );
}

