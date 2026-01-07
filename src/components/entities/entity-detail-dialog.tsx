"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Pencil, Save, X, Loader2, Trash2, BookOpen } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/time";
import { updateEntity, deleteEntity } from "@/lib/api/projects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { entityLibraryKeys, ENTITY_LIBRARY_TYPE_OPTIONS } from "@/hooks/use-entities";
import { useEnumStore } from "@/stores/enum-store";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import type { EntityRead } from "@/types/api";

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
  const enums = ["CharacterRole", "CharacterImportance", "WorldviewCategory", "WorldBuildingFragmentCategory", "EntityType"];
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

// 属性标签映射
const attributeLabels: Record<string, string> = {
  role: "角色类型",
  importance: "重要性",
  category: "类别",
  personality: "性格特点",
  abilities: "能力",
  power_level: "力量等级",
  faction: "阵营",
  gf_type: "金手指类型",
  level: "等级",
};

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
      setIsEditing(false);
    }
  }, [entity]);

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; content: string }) => {
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
    }
    setIsEditing(false);
  }, [entity]);

  const handleSave = useCallback(() => {
    updateMutation.mutate({
      name: editedName,
      content: editedContent,
    });
  }, [editedName, editedContent, updateMutation]);

  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync();
  }, [deleteMutation]);

  if (!entity) return null;

  // 获取项目名称
  const projectName = projectNameMap?.get(entity.project_id);

  // 渲染属性值
  const renderAttributeValue = (key: string, value: unknown): React.ReactNode => {
    if (Array.isArray(value)) {
      return value.map((v, i) => (
        <Badge key={i} variant="outline" className="text-xs">
          {getTagLabel(String(v), getLabel, getFieldValueLabel)}
        </Badge>
      ));
    }
    if (typeof value === "string") {
      return (
        <span className="text-sm">
          {getTagLabel(value, getLabel, getFieldValueLabel)}
        </span>
      );
    }
    return <span className="text-sm">{String(value)}</span>;
  };

  // 过滤要显示的属性
  const displayAttributes = entity.attributes
    ? Object.entries(entity.attributes).filter(
        ([, value]) => value !== null && value !== undefined && value !== ""
      )
    : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between gap-4 pr-8">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="shrink-0">
                  {getTypeLabel(entity.entity_type, getLabel)}
                </Badge>
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="font-semibold"
                    placeholder="设定名称"
                  />
                ) : (
                  <DialogTitle className="truncate">{entity.name}</DialogTitle>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {formatTimeAgo(entity.created_at)}
              </span>
            </div>
          </DialogHeader>

          <Separator className="shrink-0" />

          {/* 来源项目 */}
          {projectName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <BookOpen className="h-4 w-4" />
              <span>来源: {projectName}</span>
            </div>
          )}

          {/* 属性区域 */}
          {displayAttributes.length > 0 && (
            <div className="space-y-2 shrink-0">
              <Label className="text-xs text-muted-foreground">属性</Label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {displayAttributes.map(([key, value]) => (
                  <div key={key} className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground shrink-0 min-w-[4.5rem]">
                      {attributeLabels[key] || key}:
                    </span>
                    <div className="flex flex-wrap items-baseline gap-1">
                      {renderAttributeValue(key, value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 标签区域 */}
          {entity.tags && entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {entity.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {getTagLabel(tag, getLabel, getFieldValueLabel)}
                </Badge>
              ))}
            </div>
          )}

          {/* 内容区域 - 可滚动 */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="输入设定内容"
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                {entity.content ? (
                  <MarkdownContent content={entity.content} />
                ) : (
                  <p className="text-muted-foreground italic">暂无内容</p>
                )}
              </div>
            )}
          </div>

          <Separator className="shrink-0" />

          <DialogFooter className="shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  取消
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
                <Button variant="outline" onClick={handleStartEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  编辑
                </Button>
              </>
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
 * 使用唯一计数器避免 key 冲突
 */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listStartLine = 0; // 记录列表开始的行号

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      const key = `list-${listStartLine}`;
      elements.push(
        <ListTag key={key} className="my-2 pl-4">
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
        <h3 key={`h3-${i}`} className="text-base font-semibold mt-4 mb-2">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-semibold mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold mt-4 mb-2">
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
        <p key={`p-${i}`} className="my-2 break-words">
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
