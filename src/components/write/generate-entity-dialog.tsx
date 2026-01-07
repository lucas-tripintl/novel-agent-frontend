"use client";

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Wand2,
  ChevronDown,
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
import { useEntities } from "@/hooks/use-analysis-results";
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

// 世界观类别
const WORLDVIEW_CATEGORIES = [
  { value: "power_system", label: "力量体系" },
  { value: "organization", label: "组织势力" },
  { value: "geography", label: "地理环境" },
  { value: "history", label: "历史事件" },
  { value: "culture", label: "文化习俗" },
  { value: "rule", label: "世界规则" },
  { value: "race", label: "种族设定" },
  { value: "economy", label: "经济体系" },
];

// 参考设定的实体类型
const REFERENCE_ENTITY_TYPES: { type: EntityType; label: string; icon: React.ReactNode }[] = [
  { type: "character", label: "角色", icon: <Users className="h-3.5 w-3.5" /> },
  { type: "worldview", label: "世界观", icon: <Globe className="h-3.5 w-3.5" /> },
  { type: "plotline", label: "剧情线", icon: <Layers className="h-3.5 w-3.5" /> },
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
  const [referenceOpen, setReferenceOpen] = useState(false);

  // 生成结果状态
  const [generatedName, setGeneratedName] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  // 对话框状态
  const [dialogState, setDialogState] = useState<DialogState>("idle");

  // API hooks
  const generateMutation = useGenerateEntity(projectId);
  const createMutation = useCreateEntity(projectId);

  // 获取各类型实体（用于参考设定选择）
  const { data: charactersData } = useEntities(projectId, "character", { limit: 50 });
  const { data: worldviewData } = useEntities(projectId, "worldview", { limit: 50 });
  const { data: plotlineData } = useEntities(projectId, "plotline", { limit: 50 });

  const entitiesByType = useMemo(
    () => ({
      character: charactersData?.items ?? [],
      worldview: worldviewData?.items ?? [],
      plotline: plotlineData?.items ?? [],
    }),
    [charactersData, worldviewData, plotlineData]
  );

  const totalEntities = Object.values(entitiesByType).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // 重置表单
  const resetForm = () => {
    setEntityType("character");
    setCategory("");
    setGuidance("");
    setSelectedEntities([]);
    setGeneratedName("");
    setGeneratedContent("");
    setDialogState("idle");
    setReferenceOpen(false);
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

      setGeneratedName(result.data.name);
      setGeneratedContent(result.data.content);
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

  // 切换参考设定选择
  const toggleEntity = (entity: EntityRead) => {
    setSelectedEntities((prev) => {
      const exists = prev.some((e) => e.id === entity.id);
      if (exists) {
        return prev.filter((e) => e.id !== entity.id);
      }
      return [...prev, entity];
    });
  };

  // 移除参考设定
  const removeEntity = (entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  // 获取当前类型的标签
  const currentTypeLabel =
    ENTITY_TYPES.find((t) => t.value === entityType)?.label ?? "设定";

  const isLoading = dialogState === "generating" || dialogState === "saving";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] h-[85vh] max-h-[700px] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            生成设定
          </DialogTitle>
          <DialogDescription>
            选择类型并描述你的需求，AI 将为你生成相应的设定
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
          <div className="space-y-4 py-4 pl-1 pr-4">
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
                disabled={dialogState !== "idle"}
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
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={dialogState !== "idle"}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORLDVIEW_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={dialogState !== "idle"}
              />
              <p className="text-xs text-muted-foreground">
                {guidance.length}/2000 字符
              </p>
            </div>

            {/* 参考设定（选填） */}
            {totalEntities > 0 && dialogState === "idle" && (
              <Collapsible open={referenceOpen} onOpenChange={setReferenceOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-3 h-9 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      参考设定（选填）
                      {selectedEntities.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          已选 {selectedEntities.length}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        referenceOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  {/* 已选设定 */}
                  {selectedEntities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-muted/50 rounded-md">
                      {selectedEntities.map((entity) => (
                        <Badge
                          key={entity.id}
                          variant="secondary"
                          className="gap-1 pr-1"
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
                    </div>
                  )}

                  {/* 设定列表 */}
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {REFERENCE_ENTITY_TYPES.map(({ type, label, icon }) => {
                      const entities =
                        entitiesByType[type as keyof typeof entitiesByType] ?? [];
                      if (entities.length === 0) return null;

                      return (
                        <div key={type} className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            {icon}
                            {label}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {entities.slice(0, 10).map((entity) => (
                              <label
                                key={entity.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                              >
                                <Checkbox
                                  checked={selectedEntities.some(
                                    (e) => e.id === entity.id
                                  )}
                                  onCheckedChange={() => toggleEntity(entity)}
                                />
                                <span className="truncate">{entity.name}</span>
                              </label>
                            ))}
                          </div>
                          {entities.length > 10 && (
                            <p className="text-xs text-muted-foreground pl-2">
                              还有 {entities.length - 10} 个...
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    选中的设定会作为参考，帮助 AI 保持内容一致性
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* 生成结果预览/编辑 */}
            {(dialogState === "preview" || dialogState === "saving") && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">生成结果</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleRegenerate}
                    disabled={isLoading}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    重新生成
                  </Button>
                </div>

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
                  <div className="border rounded-md p-3 min-h-[200px] bg-background">
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

            {/* 生成中状态 */}
            {dialogState === "generating" && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>正在生成{currentTypeLabel}...</p>
                <p className="text-xs mt-1">这可能需要 5-15 秒</p>
              </div>
            )}
          </div>
        </ScrollArea>
        </div>

        <DialogFooter className="pt-4 border-t shrink-0">
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

          {(dialogState === "preview" || dialogState === "saving") && (
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
    </Dialog>
  );
}
