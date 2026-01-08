"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Plus, Loader2 } from "lucide-react";
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
import { useCreateProject } from "@/hooks/use-projects";

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
  const [isLoading, setIsLoading] = useState(false);

  const mutation = useCreateProject();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const result = await mutation.mutateAsync({
        name: name.trim(),
        project_type: projectType.trim() || undefined,
        description: description.trim() || undefined,
      });
      handleOpenChange(false);
      router.push(`/write/${result.id}`);
    } catch {
      // 错误由 React Query 处理
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setProjectType("");
      setDescription("");
    }
    onOpenChange(open);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && name.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("createDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("createDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* 作品名称 */}
          <div className="space-y-2">
            <Label htmlFor="project-name">
              {t("createDialog.nameLabel")}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("createDialog.namePlaceholder")}
              className="bg-background/50"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* 小说类型 */}
          <div className="space-y-2">
            <Label htmlFor="project-type">
              {t("createDialog.typeLabel")}
            </Label>
            <Input
              id="project-type"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value.slice(0, 20))}
              onKeyDown={handleKeyDown}
              placeholder={t("createDialog.typePlaceholder")}
              className="bg-background/50"
              maxLength={20}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("createDialog.typeHint")}
            </p>
          </div>

          {/* 简介 */}
          <div className="space-y-2">
            <Label htmlFor="project-description">
              {t("createDialog.descriptionLabel")}
            </Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("createDialog.descriptionPlaceholder")}
              className="bg-background/50 min-h-[100px] resize-none"
              maxLength={500}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
