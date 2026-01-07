"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Save,
  X,
  Loader2,
  Trash2,
  BookOpen,
  Clock,
  Tag,
  Layers,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/time";
import { updateEntity, deleteEntity } from "@/lib/api/projects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  entityLibraryKeys,
  ENTITY_LIBRARY_TYPE_OPTIONS,
} from "@/hooks/use-entities";
import { useEnumStore } from "@/stores/enum-store";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { CharacterAttributesEditor } from "@/components/common/character-attributes-editor";
import type { EntityRead, EntityType } from "@/types/api";
import { cn } from "@/lib/utils";

interface EntityDetailDialogProps {
  entity: EntityRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedEntity: EntityRead) => void;
  onDelete?: () => void;
  projectNameMap?: Map<string, string>;
}

// 标签本地化函数
function getTagLabel(
  tag: string,
  getLabel: (enumName: string, value: string) => string,
  getFieldValueLabel: (fieldName: string, value: string) => string
): string {
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(tag)) return tag;

  // 1. 尝试从枚举获取标签
  const enums = [
    "CharacterRole",
    "CharacterImportance",
    "WorldviewCategory",
    "WorldBuildingFragmentCategory",
    "EntityType",
  ];
  for (const enumName of enums) {
    const label = getLabel(enumName, tag);
    if (label !== tag) return label;
  }

  // 2. 尝试从 field_values 获取标签
  const fieldNames = ["golden_finger_type", "importance", "gf_type"];
  for (const fieldName of fieldNames) {
    const label = getFieldValueLabel(fieldName, tag);
    if (label !== tag) return label;
  }

  return tag;
}

// 获取实体类型标签
function getTypeLabel(
  type: string,
  getLabel: (enumName: string, value: string) => string
): string {
  const enumLabel = getLabel("EntityType", type);
  if (enumLabel !== type) return enumLabel;
  // fallback 到静态配置
  const option = ENTITY_LIBRARY_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.label ?? type;
}

// 静态属性标签映射（作为 fallback）
const staticAttributeLabels: Record<string, string> = {
  role: "角色类型",
  importance: "重要性",
  category: "类别",
  personality: "性格特点",
  abilities: "能力",
  power_level: "力量等级",
  faction: "阵营",
  gf_type: "金手指类型",
  level: "等级",
  first_appearance: "首次出现章节",
  description: "描述",
  background: "背景",
  goals: "目标",
  relationships: "关系",
  appearance: "外貌",
  skills: "技能",
  weaknesses: "弱点",
  strengths: "优势",
};

// 获取属性标签（支持从 character_attributes 枚举获取）
function getAttributeLabel(
  key: string,
  entityType: EntityType,
  getFieldValueLabel: (fieldName: string, value: string) => string
): string {
  // 如果是角色类型，尝试从 character_attributes 获取翻译
  if (entityType === "character") {
    const label = getFieldValueLabel("character_attributes", key);
    if (label !== key) return label;
  }

  // fallback 到静态映射
  if (staticAttributeLabels[key]) {
    return staticAttributeLabels[key];
  }

  // 最后尝试格式化 key 本身
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function EntityDetailDialog({
  entity,
  open,
  onOpenChange,
  onSave,
  onDelete,
  projectNameMap,
}: EntityDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedAttributes, setEditedAttributes] = useState<Record<string, unknown>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  // 枚举本地化
  const getLabel = useEnumStore((state) => state.getLabel);
  const getFieldValueLabel = useEnumStore((state) => state.getFieldValueLabel);

  // 当 entity 改变时，重置编辑状态
  useEffect(() => {
    if (entity) {
      setEditedName(entity.name);
      setEditedContent(entity.content || "");
      setEditedAttributes(entity.attributes || {});
      setIsEditing(false);
    }
  }, [entity]);

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; content: string; attributes?: Record<string, unknown> }) => {
      if (!entity) throw new Error("No entity selected");
      return updateEntity(entity.project_id, entity.id, data);
    },
    onSuccess: (updatedEntity) => {
      queryClient.invalidateQueries({ queryKey: entityLibraryKeys.all });
      setIsEditing(false);
      onSave?.(updatedEntity);
    },
  });

  // 删除 mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!entity) throw new Error("No entity selected");
      return deleteEntity(entity.project_id, entity.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityLibraryKeys.all });
      setShowDeleteDialog(false);
      onOpenChange(false);
      onDelete?.();
    },
  });

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (entity) {
      setEditedName(entity.name);
      setEditedContent(entity.content || "");
      setEditedAttributes(entity.attributes || {});
    }
    setIsEditing(false);
  }, [entity]);

  const handleSave = useCallback(() => {
    // 对于角色类型，同时保存属性
    const data: { name: string; content: string; attributes?: Record<string, unknown> } = {
      name: editedName,
      content: editedContent,
    };
    if (entity?.entity_type === "character") {
      data.attributes = editedAttributes;
    }
    updateMutation.mutate(data);
  }, [editedName, editedContent, editedAttributes, entity?.entity_type, updateMutation]);

  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync();
  }, [deleteMutation]);

  // 获取项目名称
  const projectName = entity ? projectNameMap?.get(entity.project_id) : null;

  // 过滤要显示的属性
  const displayAttributes = useMemo(() => {
    if (!entity?.attributes) return [];
    return Object.entries(entity.attributes).filter(
      ([key, value]) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        key !== "description" // description 通常在 content 中
    );
  }, [entity?.attributes]);

  // 渲染属性值
  const renderAttributeValue = useCallback(
    (key: string, value: unknown): React.ReactNode => {
      if (Array.isArray(value)) {
        if (value.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((v, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-xs font-normal"
              >
                {getTagLabel(String(v), getLabel, getFieldValueLabel)}
              </Badge>
            ))}
          </div>
        );
      }
      if (typeof value === "string") {
        return (
          <span className="text-sm text-foreground">
            {getTagLabel(value, getLabel, getFieldValueLabel)}
          </span>
        );
      }
      return <span className="text-sm text-foreground">{String(value)}</span>;
    },
    [getLabel, getFieldValueLabel]
  );

  if (!entity) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "sm:max-w-2xl p-0 gap-0 overflow-hidden",
            "max-h-[85vh] flex flex-col"
          )}
        >
          {/* ===== 头部区域 ===== */}
          <DialogHeader className="shrink-0 p-6 pb-4 space-y-3 border-b border-border/50">
            {/* 类型徽章 */}
            <div className="flex items-center gap-2 pr-8">
              <Badge
                variant="outline"
                className="text-xs font-medium px-2.5 py-0.5"
              >
                {getTypeLabel(entity.entity_type, getLabel)}
              </Badge>
            </div>

            {/* 标题 */}
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-lg font-semibold h-10"
                placeholder="设定名称"
                autoFocus
              />
            ) : (
              <DialogTitle className="text-xl font-semibold leading-tight pr-8">
                {entity.name}
              </DialogTitle>
            )}

            {/* 来源项目 + 时间 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {projectName && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{projectName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">
                  {formatTimeAgo(entity.created_at)}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* ===== 可滚动内容区域 ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* 属性区域 */}
              {entity.entity_type === "character" ? (
                // 角色类型：使用专用的角色属性编辑器
                <section className="space-y-3">
                  <CharacterAttributesEditor
                    attributes={editedAttributes}
                    onChange={setEditedAttributes}
                    readOnly={!isEditing}
                    compact
                  />
                </section>
              ) : (
                // 其他类型：只读展示属性
                displayAttributes.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      <span>属性</span>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
                      <div className="divide-y divide-border/30">
                        {displayAttributes.map(([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-2.5"
                          >
                            <span className="text-sm text-muted-foreground leading-6">
                              {getAttributeLabel(
                                key,
                                entity.entity_type,
                                getFieldValueLabel
                              )}
                            </span>
                            <div className="min-w-0 leading-6">
                              {renderAttributeValue(key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )
              )}

              {/* 标签区域 */}
              {entity.tags && entity.tags.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>标签</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entity.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {getTagLabel(tag, getLabel, getFieldValueLabel)}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* 内容区域 */}
              <section className="space-y-3">
                {isEditing ? (
                  <>
                    <label
                      htmlFor="entity-content"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      内容
                    </label>
                    <Textarea
                      id="entity-content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="输入设定内容..."
                      className="min-h-[240px] font-mono text-sm resize-none"
                    />
                  </>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {entity.content ? (
                      <MarkdownContent content={entity.content} />
                    ) : (
                      <p className="text-muted-foreground italic text-sm">
                        暂无内容
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* ===== 底部操作区域 ===== */}
          <DialogFooter className="shrink-0 p-4 border-t border-border/50 bg-muted/20">
            {isEditing ? (
              <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <X className="mr-1.5 h-4 w-4" />
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  删除
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="flex-1 sm:flex-none"
                >
                  <Pencil className="mr-1.5 h-4 w-4" />
                  编辑
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        targetName={`设定「${entity.name}」`}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

/**
 * 简单的 Markdown 渲染组件
 * 支持标题、列表、粗体、斜体
 */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listStartLine = 0;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      const key = `list-${listStartLine}`;
      elements.push(
        <ListTag
          key={key}
          className={cn(
            "my-2 space-y-1",
            listType === "ul" ? "list-disc pl-5" : "list-decimal pl-5"
          )}
        >
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
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
        <h3
          key={`h3-${i}`}
          className="text-base font-semibold mt-4 mb-2 first:mt-0"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg font-semibold mt-5 mb-2 first:mt-0"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-xl font-bold mt-5 mb-2 first:mt-0"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
    }
    // 无序列表
    else if (line.match(/^[-*]\s/)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
        listStartLine = i;
      }
      listItems.push(line.replace(/^[-*]\s/, ""));
    }
    // 有序列表
    else if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
        listStartLine = i;
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
        <p key={`p-${i}`} className="text-sm leading-relaxed my-2 first:mt-0">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

/**
 * 渲染行内 Markdown 元素
 */
function renderInline(text: string): React.ReactNode {
  // 处理粗体 **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // 处理斜体 *text*
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
