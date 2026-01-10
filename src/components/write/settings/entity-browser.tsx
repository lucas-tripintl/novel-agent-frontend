"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  useProjectElements,
  elementCategories,
  groupEntitiesByCategory,
  getCategoryConfig,
} from "@/hooks/use-project-elements";
import { useEnumStore } from "@/stores/enum-store";
import { useWritingStore, useWritingMode, useEntityEditing } from "@/stores/writing-store";
import type { EntityRead, EntityType } from "@/types/api";
import type { SelectedEntity } from "@/types/writing";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Check,
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
  const t = useTranslations("write");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { data, isLoading } = useProjectElements(projectId, true);
  const mode = useWritingMode();
  const { selectedEntities, addEntity, removeEntity } = useWritingStore();
  const { setEditingEntity } = useEntityEditing();
  // 订阅 loaded 状态确保枚举加载后重渲染
  useEnumStore((state) => state.loaded);
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

  // 按分类分组
  const groupedEntities = useMemo(
    () => groupEntitiesByCategory(data?.items ?? [], searchKeyword),
    [data?.items, searchKeyword]
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
    <div className="flex h-full flex-col min-h-0 w-full">
      {/* 搜索栏 */}
      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchSettings")}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-7 h-7 text-xs bg-background/50"
          />
        </div>
      </div>

      {/* 模式提示 */}
      {mode === "auto" && (
        <div className="mx-2 mb-2 p-1.5 rounded-md bg-primary/5 border border-primary/20">
          <p className="text-[11px] text-muted-foreground">
            <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
            {t("autoModeHint")}
          </p>
        </div>
      )}

      {/* 设定列表 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 pt-0">
          {nonEmptyCategories.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Globe className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                {searchKeyword ? t("noMatchingSettings") : t("noSettings")}
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
                    <AccordionTrigger className="hover:no-underline px-2 py-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium truncate flex-1 min-w-0">
                          {getTypeLabel(category.type)}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] shrink-0"
                        >
                          {catEntities.length}
                        </Badge>
                        {mode === "director" && selectedInCategory > 0 && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px] shrink-0"
                          >
                            +{selectedInCategory}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-0.5">
                        {catEntities.map((entity) => (
                          <EntityRow
                            key={entity.id}
                            entity={entity}
                            isSelected={isEntitySelected(entity.id)}
                            isSelectable={mode === "director"}
                            onToggle={() => toggleEntity(entity)}
                            onClick={() => openEntityEditor(entity)}
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
    </div>
  );
}

// ============ 实体行组件 ============

interface EntityRowProps {
  entity: EntityRead;
  isSelected: boolean;
  isSelectable: boolean;
  onToggle: () => void;
  onClick: () => void;
  getLabel: (enumName: string, value: string) => string;
  getFieldValueLabel: (fieldName: string, value: string) => string;
}

function EntityRow({
  entity,
  isSelected,
  isSelectable,
  onToggle,
  onClick,
  getLabel,
  getFieldValueLabel,
}: EntityRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-1.5 py-1 rounded transition-colors group min-w-0",
        isSelectable && "cursor-pointer",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : isSelectable
          ? "hover:bg-muted/50 border border-transparent"
          : "hover:bg-muted/50 border border-transparent"
      )}
      onClick={isSelectable ? onToggle : onClick}
    >
      {/* 选择指示器 */}
      {isSelectable && (
        <div
          className={cn(
            "h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0",
            isSelected
              ? "bg-primary border-primary"
              : "border-muted-foreground/30"
          )}
        >
          {isSelected && <Check className="h-2 w-2 text-primary-foreground" />}
        </div>
      )}

      {/* 名称 */}
      <span className="text-xs flex-1 truncate min-w-0">{entity.name}</span>

      {/* 标签 - 在窄屏隐藏 */}
      {entity.tags && entity.tags.length > 0 && (
        <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
          {getTagLabel(entity.tags[0], getLabel, getFieldValueLabel)}
        </Badge>
      )}
    </div>
  );
}

