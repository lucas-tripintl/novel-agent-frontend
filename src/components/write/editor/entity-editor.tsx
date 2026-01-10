"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEntityEditing, useEditorSettings } from "@/stores/writing-store";
import { useEnumStore } from "@/stores/enum-store";
import { updateEntity, deleteEntity } from "@/lib/api/projects";
import { getCategoryConfig, elementCategories } from "@/hooks/use-project-elements";
import type { EntityRead } from "@/types/api";
import { fontFamilies, type EditorFontFamily } from "@/types/writing";
import type { QuickAction } from "@/types/inline-edit";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SimpleTiptapEditor } from "./simple-tiptap-editor";
import { useInlineEdit } from "@/hooks/use-inline-edit";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmLeaveDialog } from "../confirm-leave-dialog";
import { useDeleteWithConfirmation } from "@/hooks/use-delete-with-confirmation";
import { CharacterAttributesEditor } from "@/components/common/character-attributes-editor";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, getStatusBadgeClasses } from "@/lib/design-tokens";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
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
  Edit3,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

function getFontClass(fontFamily: EditorFontFamily): string {
  const font = fontFamilies.find((f) => f.id === fontFamily);
  return font?.fontClass ?? "font-sans";
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

interface EntityEditorProps {
  entity: EntityRead;
  projectId: string;
}

export function EntityEditor({ entity, projectId }: EntityEditorProps) {
  const {
    editingEntityContent,
    isEntityDirty,
    setEditingEntityContent,
    markEntityAsSaved,
    closeEntityEditor,
  } = useEntityEditing();
  const { settings } = useEditorSettings();
  const getLabel = useEnumStore((state) => state.getLabel);
  const getFieldValueLabel = useEnumStore((state) => state.getFieldValueLabel);

  // 内联编辑 hook
  const {
    inlineEdit,
    executeQuickAction,
    startCustomEdit,
    acceptEdit,
    rejectEdit,
  } = useInlineEdit({
    projectId: projectId || "",
    onEditComplete: (suggestion) => {
      console.log("设定编辑完成:", suggestion);
    },
    onError: (error) => {
      console.error("内联编辑错误:", error);
    },
  });

  const [name, setName] = useState(entity.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tags, setTags] = useState<string[]>(entity.tags || []);
  const [newTag, setNewTag] = useState("");
  const [attributes, setAttributes] = useState<Record<string, unknown>>(entity.attributes || {});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(false);

  // 计算本地脏状态（检测 name/tags/attributes 变化）
  const isLocalDirty = useMemo(() => {
    return (
      name !== entity.name ||
      JSON.stringify(tags) !== JSON.stringify(entity.tags || []) ||
      JSON.stringify(attributes) !== JSON.stringify(entity.attributes || {})
    );
  }, [name, entity.name, tags, entity.tags, attributes, entity.attributes]);

  // 综合脏状态：content 变化 (store) + 本地字段变化
  const hasUnsavedChanges = isEntityDirty || isLocalDirty;

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 当切换到不同设定时，同步更新本地状态并重置滚动位置
  useEffect(() => {
    setName(entity.name);
    setIsEditingName(false);
    setTags(entity.tags || []);
    setAttributes(entity.attributes || {});
    setSaveStatus("idle");

    // 重置滚动位置到顶部
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [entity.id, entity.name, entity.tags, entity.attributes]);

  // 解析 JSON 内容
  const parsedContent = useMemo(() => {
    try {
      const parsed = JSON.parse(editingEntityContent);
      if (typeof parsed === "object" && parsed !== null) {
        return { isJson: true, data: parsed, error: null };
      }
      return { isJson: false, data: null, error: null };
    } catch {
      return { isJson: false, data: null, error: null };
    }
  }, [editingEntityContent]);

  // 更新设定的 mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return updateEntity(projectId, entity.id, {
        name,
        content: editingEntityContent,
        tags,
        attributes,
      });
    },
    onSuccess: () => {
      markEntityAsSaved();
      queryClient.invalidateQueries({ queryKey: ["project-elements", projectId] });
      setSaveStatus("success");

      // 如果需要保存后关闭
      if (shouldCloseAfterSave) {
        setShouldCloseAfterSave(false);
        closeEntityEditor();
      } else {
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    },
    onError: () => {
      setSaveStatus("error");
      setShouldCloseAfterSave(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
  });

  // 删除操作 - 使用 useDeleteWithConfirmation 进行标准化删除流程
  const {
    showConfirmDialog: showDeleteDialog,
    setShowConfirmDialog: setShowDeleteDialog,
    isDeleting,
    ConfirmDialog: DeleteConfirmDialog,
  } = useDeleteWithConfirmation({
    targetName: `设定「${entity.name}」`,
    deleteFn: async () => {
      await deleteEntity(projectId, entity.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-elements", projectId] });
      closeEntityEditor();
    },
  });



  // 处理保存
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [updateMutation]);

  // 处理返回
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      closeEntityEditor();
    }
  };

  // 保存后关闭
  const handleSaveAndClose = async () => {
    setShouldCloseAfterSave(true);
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync();
    } catch {
      setSaveStatus("error");
      setShouldCloseAfterSave(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // 放弃更改并关闭
  const handleDiscardAndClose = () => {
    closeEntityEditor();
  };

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // 处理设定内容快捷操作
  const handleContentQuickAction = (
    action: QuickAction,
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    executeQuickAction(action, selectedText, range, "entity");
  };

  // 处理设定内容自定义编辑
  const handleContentCustomEdit = (
    selectedText: string,
    range: { from: number; to: number }
  ) => {
    startCustomEdit(selectedText, range, "entity");
    // TODO: 打开 AI 助手面板输入自定义指令
  };

  // 处理接受编辑
  const handleAcceptEdit = (newText: string) => {
    // 获取当前内容，执行替换
    if (inlineEdit.range) {
      const before = editingEntityContent.slice(0, inlineEdit.range.from);
      const after = editingEntityContent.slice(inlineEdit.range.to);
      setEditingEntityContent(before + newText + after);
    }
    acceptEdit();
  };

  // 处理拒绝编辑
  const handleRejectEdit = () => {
    rejectEdit();
  };

  // 更新 JSON 字段
  const updateJsonField = useCallback(
    (path: string[], value: unknown) => {
      if (!parsedContent.isJson) return;

      const newData = JSON.parse(JSON.stringify(parsedContent.data));
      let current = newData;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      setEditingEntityContent(JSON.stringify(newData, null, 2));
    },
    [parsedContent, setEditingEntityContent]
  );

  const catConfig = getCategoryConfig(entity.entity_type);
  const Icon = iconMap[catConfig.icon] || Circle;

  return (
    <>
      <ConfirmLeaveDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="设定有未保存的更改"
        description="当前设定有未保存的更改，是否保存后再离开？"
        onSave={handleSaveAndClose}
        onDiscard={handleDiscardAndClose}
        isSaving={updateMutation.isPending}
      />
      <DeleteConfirmDialog />
      <div className="flex h-full flex-col bg-background">
        {/* 头部 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                className="text-lg font-semibold h-8"
                placeholder="设定名称"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold truncate">{name || "未命名设定"}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setIsEditingName(true)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{catConfig.label}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 保存状态提示 */}
            {saveStatus === "success" && (
              <Badge variant="outline" className={getStatusBadgeClasses('success')}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                已保存
              </Badge>
            )}
            {saveStatus === "error" && (
              <Badge variant="outline" className={getStatusBadgeClasses('error')}>
                <XCircle className="h-3 w-3 mr-1" />
                保存失败
              </Badge>
            )}
            {saveStatus === "idle" && hasUnsavedChanges && (
              <Badge variant="outline" className={getStatusBadgeClasses('warning')}>
                <AlertCircle className="h-3 w-3 mr-1" />
                未保存
              </Badge>
            )}

            {/* 保存按钮 */}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saveStatus === "saving"}
              className="gap-1.5"
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存
                </>
              )}
            </Button>

            {/* 删除按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            {/* 标签编辑区 */}
            <div className="px-6 py-3 border-b border-border/30 bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">标签:</span>
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {getTagLabel(tag, getLabel, getFieldValueLabel)}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    placeholder="添加标签..."
                    className="h-6 w-24 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 属性编辑区 */}
            {entity.entity_type === "character" ? (
              // 角色类型：使用专用的角色属性编辑器（支持添加/删除属性）
              <div className="px-6 py-4 border-b border-border/30">
                <CharacterAttributesEditor
                  attributes={attributes}
                  onChange={setAttributes}
                />
              </div>
            ) : (
              // 其他类型：使用通用属性编辑器（仅在有属性时显示）
              Object.keys(attributes).length > 0 && (
                <div className="px-6 py-4 border-b border-border/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">属性</span>
                    <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                      {Object.keys(attributes).length} 项
                    </Badge>
                  </div>
                  <AttributesEditor
                    entityType={entity.entity_type}
                    attributes={attributes}
                    onChange={setAttributes}
                    getLabel={getLabel}
                    getFieldValueLabel={getFieldValueLabel}
                  />
                </div>
              )
            )}

            {/* 内容编辑区 */}
            <div className="p-6 pt-4">
              {parsedContent.isJson ? (
                <JsonVisualEditor
                  data={parsedContent.data}
                  onUpdate={updateJsonField}
                />
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">内容</Label>
                  <SimpleTiptapEditor
                    value={editingEntityContent}
                    onChange={setEditingEntityContent}
                    targetType="entity"
                    mode="multi-line"
                    markdown
                    placeholder="输入设定内容（支持 Markdown 格式）..."
                    className={cn("min-h-[400px]", getFontClass(settings.fontFamily))}
                    editorClassName="min-h-[400px]"
                    enableInlineEdit={!!projectId}
                    onQuickAction={handleContentQuickAction}
                    onOpenCustomEdit={handleContentCustomEdit}
                    onAcceptEdit={handleAcceptEdit}
                    onRejectEdit={handleRejectEdit}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

// ============ JSON 可视化编辑器 ============

interface JsonVisualEditorProps {
  data: Record<string, unknown>;
  onUpdate: (path: string[], value: unknown) => void;
  path?: string[];
}

function JsonVisualEditor({
  data,
  onUpdate,
  path = [],
}: JsonVisualEditorProps) {
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <JsonField
          key={key}
          fieldKey={key}
          value={value}
          path={[...path, key]}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

interface JsonFieldProps {
  fieldKey: string;
  value: unknown;
  path: string[];
  onUpdate: (path: string[], value: unknown) => void;
}

function JsonField({ fieldKey, value, path, onUpdate }: JsonFieldProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 格式化字段名
  const formatFieldName = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // 基础类型
  if (typeof value === "string") {
    const isLongText = value.length > 100;
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {formatFieldName(fieldKey)}
        </Label>
        {isLongText ? (
          <Textarea
            value={value}
            onChange={(e) => onUpdate(path, e.target.value)}
            className="min-h-[100px] text-sm"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onUpdate(path, e.target.value)}
            className="text-sm"
          />
        )}
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {formatFieldName(fieldKey)}
        </Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onUpdate(path, Number(e.target.value))}
          className="text-sm font-mono"
        />
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onUpdate(path, e.target.checked)}
          className="h-4 w-4"
        />
        <Label className="text-sm">{formatFieldName(fieldKey)}</Label>
      </div>
    );
  }

  // 数组
  if (Array.isArray(value)) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 rounded-md px-2 py-1.5 -ml-2">
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-90"
            )}
          />
          <span className="text-sm font-medium">{formatFieldName(fieldKey)}</span>
          <Badge variant="outline" className="ml-auto font-mono text-[10px]">
            {value.length} 项
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-2 space-y-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/30"
            >
              <span className="text-xs text-muted-foreground font-mono shrink-0 pt-2">
                [{index}]
              </span>
              <div className="flex-1">
                {typeof item === "object" && item !== null ? (
                  <JsonVisualEditor
                    data={item as Record<string, unknown>}
                    path={[...path, String(index)]}
                    onUpdate={onUpdate}
                  />
                ) : typeof item === "string" ? (
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newArray = [...value];
                      newArray[index] = e.target.value;
                      onUpdate(path, newArray);
                    }}
                    className="text-sm"
                  />
                ) : (
                  <span className="text-sm">{String(item)}</span>
                )}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // 嵌套对象
  if (typeof value === "object" && value !== null) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 rounded-md px-2 py-1.5 -ml-2">
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-90"
            )}
          />
          <span className="text-sm font-medium">{formatFieldName(fieldKey)}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-2 border-l-2 border-border/30 ml-1">
          <JsonVisualEditor
            data={value as Record<string, unknown>}
            path={path}
            onUpdate={onUpdate}
          />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // null 或其他
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {formatFieldName(fieldKey)}
      </Label>
      <Input
        value={value === null ? "" : String(value)}
        onChange={(e) => onUpdate(path, e.target.value || null)}
        className="text-sm"
        placeholder="(空)"
      />
    </div>
  );
}

// ============ 属性编辑器 ============

// 属性字段配置
const attributeFieldConfig: Record<string, {
  label: string;
  type: "text" | "select" | "array";
  enumName?: string;
}> = {
  role: { label: "角色类型", type: "select", enumName: "CharacterRole" },
  importance: { label: "重要性", type: "select", enumName: "CharacterImportance" },
  category: { label: "类别", type: "select", enumName: "WorldviewCategory" },
  gf_type: { label: "金手指类型", type: "select" },
  personality: { label: "性格特点", type: "array" },
  abilities: { label: "能力", type: "array" },
  power_level: { label: "力量等级", type: "text" },
  faction: { label: "所属阵营", type: "text" },
};

interface AttributeItemProps {
  attrKey: string;
  value: unknown;
  config?: { label: string; type: string; enumName?: string };
  formatAttrName: (key: string) => string;
  getDisplayValue: (key: string, value: unknown) => string;
  onUpdate: (key: string, value: unknown) => void;
  entityType?: string;
}

function AttributeItem({
  attrKey,
  value,
  config,
  formatAttrName,
  getDisplayValue,
  onUpdate,
}: AttributeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ""));

  // 数组类型
  if (config?.type === "array" || Array.isArray(value)) {
    const arrayValue = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {formatAttrName(attrKey)}
        </Label>
        <div className="flex flex-wrap gap-2">
          {arrayValue.map((item, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="gap-1 pr-1 text-sm py-1 whitespace-normal text-left h-auto"
            >
              <span className="break-all">{String(item)}</span>
              <button
                onClick={() => {
                  const newArr = arrayValue.filter((_, i) => i !== idx);
                  onUpdate(attrKey, newArr);
                }}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input
              placeholder="添加..."
              className="h-8 w-32 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    onUpdate(attrKey, [...arrayValue, target.value.trim()]);
                    target.value = "";
                  }
                }
              }}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 下拉选择类型 (只读/系统分析)
  if (config?.type === "select") {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {formatAttrName(attrKey)}
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1">
            {getDisplayValue(attrKey, value)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            (由系统分析设定)
          </span>
        </div>
      </div>
    );
  }

  // 文本类型: 读写分离
  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          {formatAttrName(attrKey)}
        </Label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              setEditValue(String(value ?? ""));
              setIsEditing(true);
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-base min-h-[80px]"
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onUpdate(attrKey, editValue);
                setIsEditing(false);
              }}
            >
              确认
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="p-3 bg-muted/20 rounded-md text-sm cursor-text hover:bg-muted/40 transition-colors min-h-[40px] whitespace-pre-wrap break-words"
          onClick={() => {
            setEditValue(String(value ?? ""));
            setIsEditing(true);
          }}
        >
          {String(value ?? "") || <span className="text-muted-foreground italic">点击编辑...</span>}
        </div>
      )}
    </div>
  );
}

interface AttributesEditorProps {
  entityType: string;
  attributes: Record<string, unknown>;
  onChange: (attrs: Record<string, unknown>) => void;
  getLabel: (enumName: string, value: string) => string;
  getFieldValueLabel: (fieldName: string, value: string) => string;
}

function AttributesEditor({
  entityType,
  attributes,
  onChange,
  getLabel,
  getFieldValueLabel,
}: AttributesEditorProps) {
  // 更新单个属性
  const updateAttribute = (key: string, value: unknown) => {
    onChange({ ...attributes, [key]: value });
  };

  const formatAttrName = (key: string) => {
    const config = attributeFieldConfig[key];
    if (config) return config.label;

    // 尝试从枚举获取翻译
    if (entityType === "character") {
      const label = getFieldValueLabel("character_attributes", key);
      if (label !== key) return label;
    }
    // 处理特殊字段名
    const specialLabels: Record<string, string> = {
      gf_type: "金手指类型",
      first_appearance: "首次出现章节",
    };
    if (specialLabels[key]) return specialLabels[key];
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // 获取属性显示值
  const getDisplayValue = (key: string, value: unknown): string => {
    if (typeof value !== "string") {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value ?? "");
    }

    const config = attributeFieldConfig[key];

    // 特殊处理 importance 字段：只有 character 类型使用 CharacterImportance 枚举
    if (key === "importance") {
      if (entityType === "character") {
        const label = getLabel("CharacterImportance", value);
        return label !== value ? label : value;
      }
      // 其他实体类型使用 field_values 的 importance 字段
      const label = getFieldValueLabel("importance", value);
      return label !== value ? label : value;
    }

    // 处理金手指类型字段
    if (key === "gf_type") {
      const label = getFieldValueLabel("golden_finger_type", value);
      return label !== value ? label : value;
    }

    // 其他有配置枚举的字段
    if (config?.enumName) {
      const label = getLabel(config.enumName, value);
      return label !== value ? label : value;
    }

    return value;
  };

  return (
    <div className="space-y-6">
      {Object.entries(attributes)
        .filter(([key]) => key !== 'description') // 过滤掉 description
        .map(([key, value]) => {
          const config = attributeFieldConfig[key];

          return (
            <AttributeItem
              key={key}
              attrKey={key}
              value={value}
              config={config}
              formatAttrName={formatAttrName}
              getDisplayValue={getDisplayValue}
              onUpdate={updateAttribute}
              entityType={entityType}
            />
          );
        })}
    </div>
  );
}
