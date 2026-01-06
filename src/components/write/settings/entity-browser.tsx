"use client";

import { useState, useMemo } from "react";
import {
  useProjectElements,
  elementCategories,
  groupEntitiesByCategory,
  getCategoryConfig,
} from "@/hooks/use-project-elements";
import { useDeleteEntity } from "@/hooks/use-projects";
import { useEnumStore } from "@/stores/enum-store";
import { useWritingStore, useWritingMode, useEntityEditing } from "@/stores/writing-store";
import type { EntityRead, EntityType } from "@/types/api";
import type { SelectedEntity } from "@/types/writing";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { cn } from "@/lib/utils";
import {
  Search,
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
  Plus,
  Check,
  Loader2,
  Edit3,
  Trash2,
} from "lucide-react";

// 标签本地化函数
function getTagLabel(
  tag: string,
  getLabel: (enumName: string, value: string) => string,
  getFieldValueLabel: (fieldName: string, value: string) => string
): string {
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(tag)) return tag;

  // 1. 尝试从枚举获取标签
  const enums = ["CharacterRole", "CharacterImportance", "WorldviewCategory", "EntityType"];
  for (const enumName of enums) {
    const label = getLabel(enumName, tag);
    if (label !== tag) return label;
  }

  // 2. 尝试从 field_values 获取标签（如金手指类型、重要性等）
  const fieldNames = ["golden_finger_type", "importance", "gf_type"];
  for (const fieldName of fieldNames) {
    const label = getFieldValueLabel(fieldName, tag);
    if (label !== tag) return label;
  }

  // 3. 尝试从静态配置获取（fallback）
  const categoryConfig = elementCategories.find((c) => c.type === tag);
  if (categoryConfig) return categoryConfig.label;

  return tag;
}

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

interface EntityBrowserProps {
  projectId: string;
}

export function EntityBrowser({ projectId }: EntityBrowserProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [entityToDelete, setEntityToDelete] = useState<EntityRead | null>(null);

  const { data, isLoading } = useProjectElements(projectId, true);
  const deleteEntityMutation = useDeleteEntity(projectId);
  const mode = useWritingMode();
  const { selectedEntities, addEntity, removeEntity } = useWritingStore();
  const { setEditingEntity } = useEntityEditing();
  // 订阅 loaded 状态确保枚举加载后重渲染
  const enumsLoaded = useEnumStore((state) => state.loaded);
  const getLabel = useEnumStore((state) => state.getLabel);
  const getFieldValueLabel = useEnumStore((state) => state.getFieldValueLabel);

  // 获取实体类型的本地化标签
  const getTypeLabel = (type: EntityType) => {
    const enumLabel = getLabel("EntityType", type);
    // 如果枚举返回原值，使用静态配置
    if (enumLabel === type) {
      return getCategoryConfig(type).label;
    }
    return enumLabel;
  };

  const entities = data?.items ?? [];

  // 按分类分组
  const groupedEntities = useMemo(
    () => groupEntitiesByCategory(entities, searchKeyword),
    [entities, searchKeyword]
  );

  // 非空分类
  const nonEmptyCategories = useMemo(() => {
    return elementCategories.filter(
      (cat) => (groupedEntities.get(cat.type)?.length || 0) > 0
    );
  }, [groupedEntities]);

  // 检查实体是否已选中
  const isEntitySelected = (entityId: string) =>
    selectedEntities.some((e) => e.id === entityId);

  // 切换实体选择
  const toggleEntity = (entity: EntityRead) => {
    if (mode !== "director") return;

    const selectedEntity: SelectedEntity = {
      id: entity.id,
      projectId,
      name: entity.name,
      entityType: entity.entity_type,
      content: entity.content,
      tags: entity.tags,
    };

    if (isEntitySelected(entity.id)) {
      removeEntity(entity.id);
    } else {
      addEntity(selectedEntity);
    }
  };

  // 打开设定编辑
  const openEntityEditor = (entity: EntityRead) => {
    setEditingEntity(entity);
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (entityToDelete) {
      await deleteEntityMutation.mutateAsync(entityToDelete.id);
      // 如果删除的实体已被选中，从选中列表移除
      if (isEntitySelected(entityToDelete.id)) {
        removeEntity(entityToDelete.id);
      }
      setEntityToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 space-y-3">
        <Skeleton className="h-9 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* 搜索栏 */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索设定..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8 h-8 text-sm bg-background/50"
          />
        </div>
      </div>

      {/* 模式提示 */}
      {mode === "auto" && (
        <div className="mx-3 mb-2 p-2 rounded-md bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
            全自动模式下，AI 会自动选择相关设定
          </p>
        </div>
      )}

      {/* 设定列表 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 pt-0">
          {nonEmptyCategories.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Globe className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchKeyword ? "没有匹配的设定" : "暂无设定"}
              </p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={expandedCategories}
              onValueChange={setExpandedCategories}
              className="space-y-1"
            >
              {nonEmptyCategories.map((category) => {
                const catEntities = groupedEntities.get(category.type) || [];
                const Icon = iconMap[category.icon] || Circle;
                const selectedInCategory = catEntities.filter((e) =>
                  isEntitySelected(e.id)
                ).length;

                return (
                  <AccordionItem
                    key={category.type}
                    value={category.type}
                    className="border border-border/30 rounded-md bg-background/50"
                  >
                    <AccordionTrigger className="hover:no-underline px-3 py-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {getTypeLabel(category.type)}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-auto font-mono text-[10px]"
                        >
                          {catEntities.length}
                        </Badge>
                        {mode === "director" && selectedInCategory > 0 && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px]"
                          >
                            +{selectedInCategory}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-3 pb-3">
                      <div className="space-y-1">
                        {catEntities.map((entity) => (
                          <EntityRow
                            key={entity.id}
                            entity={entity}
                            isSelected={isEntitySelected(entity.id)}
                            isSelectable={mode === "director"}
                            onToggle={() => toggleEntity(entity)}
                            onEdit={() => openEntityEditor(entity)}
                            onDelete={() => setEntityToDelete(entity)}
                            getLabel={getLabel}
                            getFieldValueLabel={getFieldValueLabel}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </ScrollArea>

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={!!entityToDelete}
        onOpenChange={(open) => !open && setEntityToDelete(null)}
        targetName={entityToDelete ? `「${entityToDelete.name}」` : ""}
        onConfirm={handleDeleteConfirm}
        isPending={deleteEntityMutation.isPending}
      />
    </div>
  );
}

// ============ 实体行组件 ============

interface EntityRowProps {
  entity: EntityRead;
  isSelected: boolean;
  isSelectable: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getLabel: (enumName: string, value: string) => string;
  getFieldValueLabel: (fieldName: string, value: string) => string;
}

function EntityRow({
  entity,
  isSelected,
  isSelectable,
  onToggle,
  onEdit,
  onDelete,
  getLabel,
  getFieldValueLabel,
}: EntityRowProps) {
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors group",
            isSelectable && "cursor-pointer",
            isSelected
              ? "bg-primary/10 border border-primary/30"
              : isSelectable
              ? "hover:bg-muted/50 border border-transparent"
              : "hover:bg-muted/50 border border-transparent"
          )}
          onClick={isSelectable ? onToggle : onEdit}
        >
          {/* 选择指示器 */}
          {isSelectable && (
            <div
              className={cn(
                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                isSelected
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </div>
          )}

          {/* 名称 */}
          <span className="text-sm flex-1 truncate">{entity.name}</span>

          {/* 标签 */}
          {entity.tags && entity.tags.length > 0 && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {getTagLabel(entity.tags[0], getLabel, getFieldValueLabel)}
            </Badge>
          )}

          {/* 操作按钮组 */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </HoverCardTrigger>

      <HoverCardContent side="right" align="start" className="w-72 p-3">
        <EntityPreview entity={entity} onEdit={onEdit} />
      </HoverCardContent>
    </HoverCard>
  );
}

// ============ 实体预览 ============

interface EntityPreviewProps {
  entity: EntityRead;
  onEdit: () => void;
}

function EntityPreview({ entity, onEdit }: EntityPreviewProps) {
  const catConfig = getCategoryConfig(entity.entity_type);
  const Icon = iconMap[catConfig.icon] || Circle;
  // 订阅 loaded 状态确保枚举加载后重渲染
  const enumsLoaded = useEnumStore((state) => state.loaded);
  const getLabel = useEnumStore((state) => state.getLabel);
  const getFieldValueLabel = useEnumStore((state) => state.getFieldValueLabel);

  // 获取实体类型的本地化标签
  const typeLabel = (() => {
    const enumLabel = getLabel("EntityType", entity.entity_type);
    return enumLabel === entity.entity_type ? catConfig.label : enumLabel;
  })();

  return (
    <div className="space-y-2">
      {/* 头部 */}
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{entity.name}</h4>
          <p className="text-xs text-muted-foreground">{typeLabel}</p>
        </div>
      </div>

      {/* 内容摘要 */}
      {entity.content && (
        <p className="text-xs text-muted-foreground line-clamp-3">
          {entity.content}
        </p>
      )}

      {/* 标签 */}
      {entity.tags && entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entity.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {getTagLabel(tag, getLabel, getFieldValueLabel)}
            </Badge>
          ))}
          {entity.tags.length > 4 && (
            <Badge variant="outline" className="text-[10px]">
              +{entity.tags.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* 编辑按钮 */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2 gap-1.5"
        onClick={onEdit}
      >
        <Edit3 className="h-3 w-3" />
        查看/编辑设定
      </Button>
    </div>
  );
}
