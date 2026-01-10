"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleTiptapEditor } from "./editor/simple-tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnumSelect } from "@/components/common/enum-label";
import {
  Loader2,
  Wand2,
  ChevronRight,
  X,
  Users,
  Globe,
  Layers,
  Sparkles,
  BookOpen,
  Save,
  RotateCcw,
} from "lucide-react";
import { useGenerateEntity, useCreateEntity } from "@/hooks/use-generate";
import { EntityBrowserDialog } from "@/components/browser/entity-browser-dialog";
import type { EntityRead, EntityType } from "@/types/api";

interface GenerateEntityDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 支持的实体类型
const ENTITY_TYPES: { value: EntityType; label: string; icon: React.ReactNode }[] = [
  { value: "character", label: "角色", icon: <Users className="h-4 w-4" /> },
  { value: "worldview", label: "世界观", icon: <Globe className="h-4 w-4" /> },
  { value: "golden_finger", label: "金手指", icon: <Sparkles className="h-4 w-4" /> },
  { value: "plotline", label: "剧情线", icon: <Layers className="h-4 w-4" /> },
  { value: "foreshadowing", label: "伏笔", icon: <BookOpen className="h-4 w-4" /> },
];

type DialogState = "idle" | "generating" | "preview" | "saving";

export function GenerateEntityDialog({
  projectId,
  open,
  onOpenChange,
}: GenerateEntityDialogProps) {
  // 表单状态
  const [entityType, setEntityType] = useState<EntityType>("character");
  const [category, setCategory] = useState("");
  const [guidance, setGuidance] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<EntityRead[]>([]);

  // 设定浏览器对话框状态
  const [entityBrowserOpen, setEntityBrowserOpen] = useState(false);

  // 生成结果状态
  const [generatedName, setGeneratedName] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  // 对话框状态
  const [dialogState, setDialogState] = useState<DialogState>("idle");

  // API hooks
  const generateMutation = useGenerateEntity(projectId);
  const createMutation = useCreateEntity(projectId);

  // 重置表单
  const resetForm = () => {
    setEntityType("character");
    setCategory("");
    setGuidance("");
    setSelectedEntities([]);
    setGeneratedName("");
    setGeneratedContent("");
    setDialogState("idle");
    setEntityBrowserOpen(false);
  };

  // 处理对话框打开/关闭
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  // 处理生成
  const handleGenerate = async () => {
    setDialogState("generating");

    try {
      const result = await generateMutation.mutateAsync({
        entity_type: entityType,
        category: entityType === "worldview" ? category || undefined : undefined,
        guidance: guidance.trim() || undefined,
        reference_ids:
          selectedEntities.length > 0
            ? { entity_ids: selectedEntities.map((e) => e.id) }
            : undefined,
      });

      setGeneratedName(result.name);
      setGeneratedContent(result.content);
      setDialogState("preview");
    } catch {
      setDialogState("idle");
    }
  };

  // 处理保存
  const handleSave = async () => {
    if (!generatedName.trim() || !generatedContent.trim()) return;

    setDialogState("saving");

    try {
      await createMutation.mutateAsync({
        entity_type: entityType,
        name: generatedName.trim(),
        content: generatedContent.trim(),
        attributes:
          entityType === "worldview" && category
            ? { category }
            : undefined,
      });

      handleOpenChange(false);
    } catch {
      setDialogState("preview");
    }
  };

  // 处理重新生成
  const handleRegenerate = () => {
    setGeneratedName("");
    setGeneratedContent("");
    setDialogState("idle");
  };

  // 移除参考设定
  const removeEntity = (entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  // 获取当前类型的标签
  const currentTypeLabel =
    ENTITY_TYPES.find((t) => t.value === entityType)?.label ?? "设定";

  const isLoading = dialogState === "generating" || dialogState === "saving";
  const isPreview = dialogState === "preview" || dialogState === "saving";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] h-[85vh] max-h-[700px] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            生成设定
          </DialogTitle>
          <DialogDescription>
            {isPreview
              ? "查看和编辑生成的设定，满意后保存到设定库"
              : "选择类型并描述你的需求，AI 将为你生成相应的设定"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              {/* 生成配置表单（仅 idle 状态显示） */}
              {dialogState === "idle" && (
                <>
                  {/* 实体类型选择 */}
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">设定类型</Label>
                    <Select
                      value={entityType}
                      onValueChange={(v) => {
                        setEntityType(v as EntityType);
                        if (v !== "worldview") {
                          setCategory("");
                        }
                      }}
                    >
                      <SelectTrigger id="entity-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              {type.icon}
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 世界观类别选择（仅 worldview 显示） */}
                  {entityType === "worldview" && (
                    <div className="space-y-2">
                      <Label htmlFor="category">世界观类别（选填）</Label>
                      <EnumSelect
                        enumName="WorldviewCategory"
                        value={category}
                        onChange={setCategory}
                        placeholder="选择类别"
                        allowEmpty={true}
                        emptyLabel="不指定类别"
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* 生成指导 */}
                  <div className="space-y-2">
                    <Label htmlFor="guidance">生成指导（选填）</Label>
                    <Textarea
                      id="guidance"
                      placeholder={`描述你想要生成的${currentTypeLabel}，例如：一个神秘的反派角色，有着不为人知的过去...`}
                      className="min-h-[100px] resize-none"
                      value={guidance}
                      onChange={(e) => setGuidance(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {guidance.length}/2000 字符
                    </p>
                  </div>

                  {/* 参考设定（选填） */}
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 h-9 text-sm border border-border/50 hover:border-primary/30"
                      onClick={() => setEntityBrowserOpen(true)}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        参考设定（选填）
                        {selectedEntities.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            已选 {selectedEntities.length}
                          </Badge>
                        )}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    {/* 已选设定预览 */}
                    {selectedEntities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-md">
                        {selectedEntities.slice(0, 5).map((entity) => (
                          <Badge
                            key={entity.id}
                            variant="secondary"
                            className="gap-1 pr-1 text-xs"
                          >
                            {entity.name}
                            <button
                              onClick={() => removeEntity(entity.id)}
                              className="ml-0.5 hover:bg-muted rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {selectedEntities.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{selectedEntities.length - 5} 个
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 生成中状态 */}
              {dialogState === "generating" && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>正在生成{currentTypeLabel}...</p>
                  <p className="text-xs mt-1">这可能需要 5-15 秒</p>
                </div>
              )}

              {/* 生成结果预览/编辑（仅 preview/saving 状态显示） */}
              {isPreview && (
                <div className="space-y-4">
                  {/* 名称编辑 */}
                  <div className="space-y-2">
                    <Label htmlFor="generated-name">名称</Label>
                    <Input
                      id="generated-name"
                      value={generatedName}
                      onChange={(e) => setGeneratedName(e.target.value)}
                      disabled={dialogState === "saving"}
                    />
                  </div>

                  {/* 内容编辑 */}
                  <div className="space-y-2">
                    <Label>内容</Label>
                    <div className="border rounded-md p-3 min-h-[300px] bg-background">
                      <SimpleTiptapEditor
                        value={generatedContent}
                        onChange={setGeneratedContent}
                        targetType="entity"
                        mode="multi-line"
                        markdown
                        placeholder="生成的内容将显示在这里..."
                        enableInlineEdit={false}
                        disabled={dialogState === "saving"}
                        className="prose prose-sm dark:prose-invert max-w-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="pt-4 border-t shrink-0">
          {isPreview && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 mr-auto"
              onClick={handleRegenerate}
              disabled={isLoading}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重新生成
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>

          {dialogState === "idle" && (
            <Button onClick={handleGenerate} className="gap-1.5">
              <Wand2 className="h-4 w-4" />
              生成
            </Button>
          )}

          {isPreview && (
            <Button
              onClick={handleSave}
              disabled={
                dialogState === "saving" ||
                !generatedName.trim() ||
                !generatedContent.trim()
              }
              className="gap-1.5"
            >
              {dialogState === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存到设定库
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* 设定浏览器对话框 */}
      <EntityBrowserDialog
        projectId={projectId}
        open={entityBrowserOpen}
        onOpenChange={setEntityBrowserOpen}
        initialSelected={selectedEntities}
        selectionMode="multiple"
        onConfirm={setSelectedEntities}
        title="选择参考设定"
        description="选中的设定会作为参考，帮助 AI 保持内容一致性"
      />
    </Dialog>
  );
}
