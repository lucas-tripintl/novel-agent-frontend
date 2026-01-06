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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import type { ProjectList } from "@/types/api";
import { Loader2, Save, Trash2 } from "lucide-react";

interface ProjectEditSheetProps {
  project: ProjectList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const projectStatusOptions = [
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "archived", label: "已归档" },
];

export function ProjectEditSheet({
  project,
  open,
  onOpenChange,
}: ProjectEditSheetProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "completed">("active");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  // 当 project 变化时，重置表单
  useEffect(() => {
    if (project) {
      setName(project.name);
      // 将 API 返回的状态映射到可编辑的状态
      const statusMap: Record<string, "active" | "archived" | "completed"> = {
        draft: "active",
        in_progress: "active",
        completed: "completed",
        paused: "active",
        archived: "archived",
        deleted: "archived",
      };
      setStatus(statusMap[project.status] || "active");
    }
  }, [project]);

  const handleSave = async () => {
    if (!project) return;

    await updateMutation.mutateAsync({
      projectId: project.id,
      data: { name, status },
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!project) return;

    await deleteMutation.mutateAsync(project.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const hasChanges = project && (name !== project.name);
  const isPending = updateMutation.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>编辑项目</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* 项目名称 */}
            <div className="space-y-2">
              <Label htmlFor="project-name">项目名称</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入项目名称"
              />
            </div>

            {/* 项目状态 */}
            <div className="space-y-2">
              <Label htmlFor="project-status">项目状态</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除项目
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !name.trim()}
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
        targetName={`项目「${project?.name}」`}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
