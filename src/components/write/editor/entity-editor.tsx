"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEntityEditing, useEditorSettings } from "@/stores/writing-store";
import { updateEntity } from "@/lib/api/projects";
import { getCategoryConfig } from "@/hooks/use-project-elements";
import type { EntityRead } from "@/types/api";
import { fontFamilies, type EditorFontFamily } from "@/types/writing";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmLeaveDialog } from "../confirm-leave-dialog";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Code2,
  FileText,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  Check,
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
  CheckCircle2,
  XCircle,
  Edit3,
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

  const [editMode, setEditMode] = useState<"visual" | "raw">("visual");
  const [name, setName] = useState(entity.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tags, setTags] = useState<string[]>(entity.tags || []);
  const [newTag, setNewTag] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(false);

  const queryClient = useQueryClient();

  // 当切换到不同设定时，同步更新本地状态
  useEffect(() => {
    setName(entity.name);
    setIsEditingName(false);
    setTags(entity.tags || []);
    setEditMode("visual");
    setSaveStatus("idle");
  }, [entity.id, entity.name, entity.tags]);

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

  // 处理保存
  const handleSave = () => {
    updateMutation.mutate();
  };

  // 处理返回
  const handleBack = () => {
    if (isEntityDirty) {
      setShowConfirmDialog(true);
    } else {
      closeEntityEditor();
    }
  };

  // 保存后关闭
  const handleSaveAndClose = () => {
    setShouldCloseAfterSave(true);
    updateMutation.mutate();
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

        <div className="flex items-center gap-2">
          {saveStatus === "success" && (
            <Badge variant="outline" className="text-green-500 border-green-500/50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              已保存
            </Badge>
          )}
          {saveStatus === "error" && (
            <Badge variant="outline" className="text-red-500 border-red-500/50">
              <XCircle className="h-3 w-3 mr-1" />
              保存失败
            </Badge>
          )}
          {saveStatus === "idle" && isEntityDirty && (
            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
              <AlertCircle className="h-3 w-3 mr-1" />
              未保存
            </Badge>
          )}
        </div>
      </div>

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
              {tag}
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

      {/* 编辑模式切换 */}
      <Tabs
        value={editMode}
        onValueChange={(v) => setEditMode(v as "visual" | "raw")}
        className="flex-1 flex flex-col"
      >
        <div className="px-6 pt-3">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="visual" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              可视化
            </TabsTrigger>
            <TabsTrigger value="raw" className="gap-1.5 text-xs">
              <Code2 className="h-3.5 w-3.5" />
              原始
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-6 pt-4">
              {parsedContent.isJson ? (
                <JsonVisualEditor
                  data={parsedContent.data}
                  onUpdate={updateJsonField}
                />
              ) : (
                <div className="space-y-3">
                  <Label>内容</Label>
                  <Textarea
                    value={editingEntityContent}
                    onChange={(e) => setEditingEntityContent(e.target.value)}
                    className={cn("min-h-[400px]", getFontClass(settings.fontFamily))}
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: settings.lineHeight,
                    }}
                    placeholder="输入设定内容..."
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="raw" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-6 pt-4">
              <Textarea
                value={editingEntityContent}
                onChange={(e) => setEditingEntityContent(e.target.value)}
                className={cn("min-h-[500px]", getFontClass(settings.fontFamily))}
                style={{
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight,
                }}
                placeholder="输入 JSON 或纯文本..."
              />
              {parsedContent.isJson && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <Check className="inline h-3 w-3 mr-1 text-green-500" />
                  有效的 JSON 格式
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
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
