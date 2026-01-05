"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Save,
  X,
  Loader2,
  Plus,
  Star,
  Lock,
  Trash2,
} from "lucide-react";
import {
  useSkill,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
  SKILL_CATEGORY_OPTIONS,
  SKILL_STAGE_OPTIONS,
  getSkillCategoryLabel,
  getSkillStageLabel,
} from "@/hooks/use-skills";
import type {
  SkillBrief,
  SkillCategory,
  SkillStage,
} from "@/types/skills";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SkillDialogProps {
  /** 技能简要信息（用于展示）或 null（创建模式） */
  skill: SkillBrief | null;
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 保存成功回调 */
  onSave?: () => void;
  /** 初始是否为编辑模式 */
  initialEdit?: boolean;
}

/** 适用阶段多选组件 */
function StageCheckboxes({
  value,
  onChange,
  disabled,
}: {
  value: SkillStage[];
  onChange: (stages: SkillStage[]) => void;
  disabled?: boolean;
}) {
  const stages = SKILL_STAGE_OPTIONS.filter((o) => o.value !== "all");

  const handleToggle = (stage: SkillStage, checked: boolean) => {
    if (checked) {
      onChange([...value, stage]);
    } else {
      onChange(value.filter((s) => s !== stage));
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {stages.map((stage) => (
        <div key={stage.value} className="flex items-center space-x-2">
          <Checkbox
            id={`stage-${stage.value}`}
            checked={value.includes(stage.value as SkillStage)}
            onCheckedChange={(checked) =>
              handleToggle(stage.value as SkillStage, checked === true)
            }
            disabled={disabled}
          />
          <label
            htmlFor={`stage-${stage.value}`}
            className="text-sm cursor-pointer"
          >
            {stage.label}
          </label>
        </div>
      ))}
    </div>
  );
}

/** 内部对话框内容组件 - 通过 key 重置状态 */
function SkillDialogContent({
  skill,
  open,
  onOpenChange,
  onSave,
  initialEdit = false,
}: SkillDialogProps) {
  const isCreateMode = skill === null;

  // 获取完整技能详情
  const { data: skillDetail, isLoading: isLoadingDetail } = useSkill(
    skill?.id ?? "",
    open && !isCreateMode && !!skill?.id
  );

  // 初始表单值
  const initialValues = useMemo(() => {
    if (isCreateMode) {
      return {
        name: "",
        description: "",
        content: "",
        category: "technique" as SkillCategory,
        stages: ["writing"] as SkillStage[],
        tags: [] as string[],
      };
    }
    if (skillDetail) {
      return {
        name: skillDetail.name,
        description: skillDetail.description,
        content: skillDetail.content,
        category: skillDetail.category,
        stages: skillDetail.applicable_stages,
        tags: skillDetail.tags || [],
      };
    }
    return null;
  }, [isCreateMode, skillDetail]);

  // 表单状态 - 使用初始值
  const [isEditing, setIsEditing] = useState(isCreateMode || initialEdit);
  const [editedName, setEditedName] = useState(initialValues?.name ?? "");
  const [editedDescription, setEditedDescription] = useState(
    initialValues?.description ?? ""
  );
  const [editedContent, setEditedContent] = useState(
    initialValues?.content ?? ""
  );
  const [editedCategory, setEditedCategory] = useState<SkillCategory>(
    initialValues?.category ?? "technique"
  );
  const [editedStages, setEditedStages] = useState<SkillStage[]>(
    initialValues?.stages ?? ["writing"]
  );
  const [editedTags, setEditedTags] = useState<string[]>(
    initialValues?.tags ?? []
  );
  const [newTag, setNewTag] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 当 skillDetail 加载完成后，如果表单为空则更新
  const shouldUpdateFromDetail =
    skillDetail && !isCreateMode && editedName === "" && !isLoadingDetail;

  // 用于显示的数据
  const displayName = shouldUpdateFromDetail ? skillDetail.name : editedName;
  const displayDescription = shouldUpdateFromDetail
    ? skillDetail.description
    : editedDescription;
  const displayContent = shouldUpdateFromDetail
    ? skillDetail.content
    : editedContent;
  const displayCategory = shouldUpdateFromDetail
    ? skillDetail.category
    : editedCategory;
  const displayStages = shouldUpdateFromDetail
    ? skillDetail.applicable_stages
    : editedStages;
  const displayTags = useMemo(
    () => (shouldUpdateFromDetail ? skillDetail?.tags || [] : editedTags),
    [shouldUpdateFromDetail, skillDetail?.tags, editedTags]
  );

  // Mutations
  const createMutation = useCreateSkill();
  const updateMutation = useUpdateSkill();
  const deleteMutation = useDeleteSkill();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const handleStartEdit = useCallback(() => {
    // 进入编辑模式时，如果表单为空，从 skillDetail 初始化
    if (skillDetail && editedName === "") {
      setEditedName(skillDetail.name);
      setEditedDescription(skillDetail.description);
      setEditedContent(skillDetail.content);
      setEditedCategory(skillDetail.category);
      setEditedStages(skillDetail.applicable_stages);
      setEditedTags(skillDetail.tags || []);
    }
    setIsEditing(true);
  }, [skillDetail, editedName]);

  const handleCancelEdit = useCallback(() => {
    if (isCreateMode) {
      onOpenChange(false);
    } else if (skillDetail) {
      setEditedName(skillDetail.name);
      setEditedDescription(skillDetail.description);
      setEditedContent(skillDetail.content);
      setEditedCategory(skillDetail.category);
      setEditedStages(skillDetail.applicable_stages);
      setEditedTags(skillDetail.tags || []);
      setIsEditing(false);
    }
  }, [isCreateMode, skillDetail, onOpenChange]);

  const handleSave = useCallback(async () => {
    const nameToSave = isEditing ? editedName : displayName;
    const descToSave = isEditing ? editedDescription : displayDescription;
    const contentToSave = isEditing ? editedContent : displayContent;
    const categoryToSave = isEditing ? editedCategory : displayCategory;
    const stagesToSave = isEditing ? editedStages : displayStages;
    const tagsToSave = isEditing ? editedTags : displayTags;

    if (stagesToSave.length === 0) {
      return;
    }

    if (isCreateMode) {
      await createMutation.mutateAsync({
        name: nameToSave,
        description: descToSave,
        content: contentToSave,
        category: categoryToSave,
        applicable_stages: stagesToSave,
        tags: tagsToSave,
      });
      onOpenChange(false);
    } else if (skill) {
      await updateMutation.mutateAsync({
        skillId: skill.id,
        data: {
          name: nameToSave,
          description: descToSave,
          content: contentToSave,
          category: categoryToSave,
          applicable_stages: stagesToSave,
          tags: tagsToSave,
        },
      });
      setIsEditing(false);
    }
    onSave?.();
  }, [
    isCreateMode,
    skill,
    isEditing,
    editedName,
    editedDescription,
    editedContent,
    editedCategory,
    editedStages,
    editedTags,
    displayName,
    displayDescription,
    displayContent,
    displayCategory,
    displayStages,
    displayTags,
    createMutation,
    updateMutation,
    onOpenChange,
    onSave,
  ]);

  const handleDelete = useCallback(async () => {
    if (skill) {
      await deleteMutation.mutateAsync(skill.id);
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSave?.();
    }
  }, [skill, deleteMutation, onOpenChange, onSave]);

  const handleAddTag = useCallback(() => {
    const tag = newTag.trim();
    const currentTags = isEditing ? editedTags : displayTags;
    if (tag && !currentTags.includes(tag)) {
      setEditedTags([...currentTags, tag]);
      setNewTag("");
    }
  }, [newTag, editedTags, displayTags, isEditing]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      const currentTags = isEditing ? editedTags : displayTags;
      setEditedTags(currentTags.filter((t) => t !== tag));
    },
    [editedTags, displayTags, isEditing]
  );

  const isSystemSkill = skill?.visibility === "system";
  const canEdit = !isSystemSkill;

  // 用于渲染的最终值
  const renderName = isEditing ? editedName : displayName;
  const renderDescription = isEditing ? editedDescription : displayDescription;
  const renderContent = isEditing ? editedContent : displayContent;
  const renderCategory = isEditing ? editedCategory : displayCategory;
  const renderStages = isEditing ? editedStages : displayStages;
  const renderTags = isEditing ? editedTags : displayTags;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 pr-8">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {!isCreateMode && skill && (
                  <>
                    {skill.visibility === "system" ? (
                      <Badge variant="secondary" className="shrink-0">
                        <Lock className="h-3 w-3 mr-1" />
                        系统
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">
                        自建
                      </Badge>
                    )}
                    {skill.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </>
                )}
                {isEditing ? (
                  <>
                    <DialogTitle className="sr-only">
                      {isCreateMode ? "创建技能" : "编辑技能"}
                    </DialogTitle>
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="font-semibold flex-1"
                      placeholder="技能名称"
                    />
                  </>
                ) : (
                  <DialogTitle className="truncate">
                    {isCreateMode ? "创建技能" : renderName}
                  </DialogTitle>
                )}
              </div>
            </div>
          </DialogHeader>

          <Separator />

          {/* 加载状态 */}
          {isLoadingDetail && !isCreateMode && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* 内容区域 */}
          {(!isLoadingDetail || isCreateMode) && (
            <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
              <div className="pl-1 pr-4 py-1 space-y-4">
                {/* 描述 */}
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Textarea
                      id="description"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="简短描述技能的作用..."
                      className="min-h-[60px]"
                    />
                  </div>
                ) : (
                  renderDescription && (
                    <p className="text-sm text-muted-foreground">
                      {renderDescription}
                    </p>
                  )
                )}

                {/* 分类 */}
                <div className="space-y-2">
                  <Label>分类</Label>
                  {isEditing ? (
                    <Select
                      value={editedCategory}
                      onValueChange={(v) =>
                        setEditedCategory(v as SkillCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_CATEGORY_OPTIONS.filter(
                          (o) => o.value !== "all"
                        ).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">
                      {getSkillCategoryLabel(renderCategory ?? "")}
                    </Badge>
                  )}
                </div>

                {/* 适用阶段 */}
                <div className="space-y-2">
                  <Label>适用阶段</Label>
                  {isEditing ? (
                    <StageCheckboxes
                      value={editedStages}
                      onChange={setEditedStages}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {renderStages?.map((stage) => (
                        <Badge
                          key={stage}
                          variant="secondary"
                          className="text-xs"
                        >
                          {getSkillStageLabel(stage)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {isEditing && editedStages.length === 0 && (
                    <p className="text-xs text-destructive">
                      请至少选择一个阶段
                    </p>
                  )}
                </div>

                {/* 标签 */}
                <div className="space-y-2">
                  <Label>标签</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {renderTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        {isEditing && (
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="添加标签"
                          className="h-6 w-24 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={handleAddTag}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* 内容 */}
                <div className="space-y-2">
                  <Label htmlFor="content">
                    Prompt 内容 {isEditing && "(Markdown)"}
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="输入技能的 prompt 内容（支持 Markdown 格式）..."
                      className="min-h-[200px] max-h-[300px] font-mono text-sm resize-y"
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-md p-4 overflow-auto max-h-[300px]">
                      {renderContent ? (
                        <pre className="whitespace-pre-wrap font-mono text-sm break-words">
                          {renderContent}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground italic">暂无内容</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          <Separator />

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <div>
              {!isCreateMode && canEdit && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={
                      isPending ||
                      !editedName.trim() ||
                      editedStages.length === 0
                    }
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isCreateMode ? "创建" : "保存"}
                  </Button>
                </>
              ) : (
                canEdit && (
                  <Button variant="outline" onClick={handleStartEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    编辑
                  </Button>
                )
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除技能「{skill?.name}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** 技能对话框 - 使用 key 来重置内部状态 */
export function SkillDialog(props: SkillDialogProps) {
  // 使用 skill.id + open 作为 key，当这些变化时重新挂载组件
  const key = `${props.skill?.id ?? "create"}-${props.open}`;
  return <SkillDialogContent key={key} {...props} />;
}
