"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseFormDialog } from "@/components/base/base-form-dialog";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { useCreateProject } from "@/hooks/use-projects";
import { useMutationLoading } from "@/hooks/use-mutation-loading";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [description, setDescription] = useState("");

  const createProjectMutation = useCreateProject();

  // Use useMutationLoading for reliable loading state management
  const { mutate: createProject, isLoading } = useMutationLoading({
    mutationFn: async (data: { name: string; project_type?: string; description?: string }) => {
      return createProjectMutation.mutateAsync(data);
    },
    onSuccess: (result) => {
      handleOpenChange(false);
      router.push(`/write/${result.id}`);
    },
  });

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createProject({
      name: name.trim(),
      project_type: projectType.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setProjectType("");
      setDescription("");
    }
    onOpenChange(open);
  };

  const isSubmitDisabled = !name.trim() || isLoading;

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("createDialog.title")}
      description={t("createDialog.description")}
      icon={Sparkles}
      maxWidth="md"
      loading={isLoading}
      onSubmit={handleSubmit}
      cancelText={tCommon("cancel")}
      submitText={tCommon("create")}
      submitVariant="default"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="glow-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("createDialog.creating")}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {tCommon("create")}
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* 作品名称 */}
        <FormInput
          id="project-name"
          label={t("createDialog.nameLabel")}
          value={name}
          onChange={setName}
          placeholder={t("createDialog.namePlaceholder")}
          required
          disabled={isLoading}
        />

        {/* 小说类型 */}
        <FormInput
          id="project-type"
          label={t("createDialog.typeLabel")}
          value={projectType}
          onChange={(value) => setProjectType(value.slice(0, 20))}
          placeholder={t("createDialog.typePlaceholder")}
          description={t("createDialog.typeHint")}
          disabled={isLoading}
        />

        {/* 简介 */}
        <FormTextarea
          id="project-description"
          label={t("createDialog.descriptionLabel")}
          value={description}
          onChange={setDescription}
          placeholder={t("createDialog.descriptionPlaceholder")}
          maxLength={500}
          showCharCount
          rows={4}
          disabled={isLoading}
        />
      </div>
    </BaseFormDialog>
  );
}
