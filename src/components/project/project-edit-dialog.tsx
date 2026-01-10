"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Settings, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseFormDialog } from "@/components/base/base-form-dialog";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { useDeleteWithConfirmation } from "@/hooks/use-delete-with-confirmation";
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

  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  // 删除操作 - 使用 useDeleteWithConfirmation 进行标准化删除流程
  const {
    showConfirmDialog,
    setShowConfirmDialog,
    isDeleting,
    ConfirmDialog,
  } = useDeleteWithConfirmation({
    targetName: project ? t("deleteConfirm", { name: project.name }) : "",
    deleteFn: async () => {
      if (!project) throw new Error("No project selected");
      await deleteMutation.mutateAsync(project.id);
    },
    onSuccess: () => {
      onOpenChange(false);
    },
  });

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

  const handleOpenChange = (open: boolean) => {
    if (!open && project) {
      // Reset form when closing
      setName(project.name);
      setProjectType(project.project_type || "");
      setDescription(project.description || "");
    }
    onOpenChange(open);
  };

  const isSubmitDisabled = !name.trim() || isLoading || isDeleting;

  return (
    <>
      <BaseFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={t("editDialog.title")}
        description={t("editDialog.description")}
        icon={Settings}
        maxWidth="md"
        loading={isLoading || isDeleting}
        onSubmit={handleSave}
        footer={
          <div className="flex justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowConfirmDialog(true)}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon("delete")}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading || isDeleting}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitDisabled}
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
          </div>
        }
      >
        <div className="space-y-5">
          {/* Project name */}
          <FormInput
            id="edit-project-name"
            label={t("editDialog.nameLabel")}
            value={name}
            onChange={setName}
            placeholder={t("editDialog.namePlaceholder")}
            required
            disabled={isLoading || isDeleting}
          />

          {/* Novel type */}
          <FormInput
            id="edit-project-type"
            label={t("editDialog.typeLabel")}
            value={projectType}
            onChange={(value) => setProjectType(value.slice(0, 20))}
            placeholder={t("editDialog.typePlaceholder")}
            description={t("editDialog.typeHint")}
            disabled={isLoading || isDeleting}
          />

          {/* Description */}
          <FormTextarea
            id="edit-project-description"
            label={t("editDialog.descriptionLabel")}
            value={description}
            onChange={setDescription}
            placeholder={t("editDialog.descriptionPlaceholder")}
            maxLength={500}
            showCharCount
            rows={4}
            disabled={isLoading || isDeleting}
          />
        </div>
      </BaseFormDialog>

      <ConfirmDialog />
    </>
  );
}
