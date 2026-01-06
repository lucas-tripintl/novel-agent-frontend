"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import {
  useUpdateFusionTask,
  useDeleteFusionTask,
  useFusionModes,
  useFusionTask,
} from "@/hooks/use-fusion";
import { Loader2, Save, Trash2 } from "lucide-react";

interface FusionTaskEditSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FusionTaskEditSheet({
  taskId,
  open,
  onOpenChange,
}: FusionTaskEditSheetProps) {
  const [fusionMode, setFusionMode] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [userIdeas, setUserIdeas] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: task, isLoading: taskLoading } = useFusionTask(taskId ?? "", {
    enabled: open && !!taskId,
  });
  const { data: modesData } = useFusionModes();
  const updateMutation = useUpdateFusionTask();
  const deleteMutation = useDeleteFusionTask();

  // 当 task 数据加载完成时，重置表单
  useEffect(() => {
    if (task) {
      setFusionMode(task.fusion_mode || "");
      setCustomInstruction(task.custom_instruction || "");
      setUserIdeas(task.user_ideas || "");
    }
  }, [task]);

  const handleSave = async () => {
    if (!taskId) return;

    await updateMutation.mutateAsync({
      taskId,
      data: {
        fusion_mode: fusionMode || undefined,
        custom_instruction: customInstruction || undefined,
        user_ideas: userIdeas || undefined,
      },
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!taskId) return;

    await deleteMutation.mutateAsync(taskId);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const isPending = updateMutation.isPending;

  // 只有在 pending 或 draft 状态下才允许编辑
  const isEditable = task && ["pending", "draft", "created"].includes(task.status);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>编辑融合任务</SheetTitle>
          </SheetHeader>

          {taskLoading ? (
            <div className="space-y-6 py-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6 py-6">
              {/* 任务 ID */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">任务 ID</Label>
                <p className="font-mono text-sm">#{taskId?.slice(0, 8)}</p>
              </div>

              {/* 融合模式 */}
              <div className="space-y-2">
                <Label htmlFor="fusion-mode">融合模式</Label>
                <Select
                  value={fusionMode}
                  onValueChange={setFusionMode}
                  disabled={!isEditable}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择融合模式" />
                  </SelectTrigger>
                  <SelectContent>
                    {modesData?.map((mode) => (
                      <SelectItem key={mode.mode} value={mode.mode}>
                        {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 自定义指令 */}
              <div className="space-y-2">
                <Label htmlFor="custom-instruction">自定义指令</Label>
                <Textarea
                  id="custom-instruction"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="输入自定义融合指令..."
                  rows={3}
                  disabled={!isEditable}
                />
              </div>

              {/* 用户想法 */}
              <div className="space-y-2">
                <Label htmlFor="user-ideas">创意想法</Label>
                <Textarea
                  id="user-ideas"
                  value={userIdeas}
                  onChange={(e) => setUserIdeas(e.target.value)}
                  placeholder="描述你的融合想法..."
                  rows={3}
                  disabled={!isEditable}
                />
              </div>

              {!isEditable && task && (
                <p className="text-xs text-muted-foreground">
                  任务已开始运行，无法编辑
                </p>
              )}
            </div>
          )}

          <SheetFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除任务
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !isEditable || taskLoading}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              保存
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        targetName={`融合任务 #${taskId?.slice(0, 8)}`}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
