"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Settings, Loader2, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import type { ProjectList } from "@/types/api";

interface ProjectEditDialogProps {
  project: ProjectList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectEditDialog({
  project,
  open,
  onOpenChange,
}: ProjectEditDialogProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");

  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setProjectType(project.project_type || "");
      setDescription(project.description || "");
    }
  }, [project]);

  const handleSave = async () => {
    if (!project || !name.trim()) return;

    setIsLoading(true);
    try {
      await updateMutation.mutateAsync({
        projectId: project.id,
        data: {
          name: name.trim(),
          project_type: projectType.trim() || undefined,
          description: description.trim() || undefined,
        },
      });
      onOpenChange(false);
    } catch {
      // Error handled by React Query
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    await deleteMutation.mutateAsync(project.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && project) {
      // Reset form when closing
      setName(project.name);
      setProjectType(project.project_type || "");
      setDescription(project.description || "");
    }
    onOpenChange(open);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              {t("editDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("editDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Project name */}
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">
                {t("editDialog.nameLabel")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="edit-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("editDialog.namePlaceholder")}
                className="bg-background/50"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Novel type */}
            <div className="space-y-2">
              <Label htmlFor="edit-project-type">
                {t("editDialog.typeLabel")}
              </Label>
              <Input
                id="edit-project-type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value.slice(0, 20))}
                onKeyDown={handleKeyDown}
                placeholder={t("editDialog.typePlaceholder")}
                className="bg-background/50"
                maxLength={20}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t("editDialog.typeHint")}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-project-description">
                {t("editDialog.descriptionLabel")}
              </Label>
              <Textarea
                id="edit-project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("editDialog.descriptionPlaceholder")}
                className="bg-background/50 min-h-[100px] resize-none"
                maxLength={500}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon("delete")}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!name.trim() || isLoading}
                className="glow-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("editDialog.saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {tCommon("save")}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        targetName={t("deleteConfirm", { name: project?.name ?? "" })}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
