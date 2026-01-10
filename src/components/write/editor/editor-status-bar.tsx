"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

export type SaveStatus = "idle" | "saving" | "success" | "error";

interface EditorStatusBarProps {
  // 标题信息
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  // 保存状态
  isDirty: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
  onBack?: () => void;
  disabled?: boolean;
  // 额外操作按钮
  extraActions?: React.ReactNode;
}

export function EditorStatusBar({
  title,
  subtitle,
  icon,
  isDirty,
  saveStatus,
  onSave,
  onBack,
  disabled,
  extraActions,
}: EditorStatusBarProps) {
  const t = useTranslations("write");
  const isSaving = saveStatus === "saving";
  const canSave = isDirty && !isSaving && !disabled;

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
      {/* 返回按钮 */}
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* 图标 */}
      {icon && (
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}

      {/* 标题区域 */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold truncate">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* 状态和操作区域 */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 保存状态提示 */}
        {saveStatus === "success" && (
          <Badge variant="outline" className="text-green-500 border-green-500/50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("saved")}
          </Badge>
        )}
        {saveStatus === "error" && (
          <Badge variant="outline" className="text-red-500 border-red-500/50">
            <XCircle className="h-3 w-3 mr-1" />
            {t("saveFailed")}
          </Badge>
        )}
        {saveStatus === "idle" && isDirty && (
          <Badge variant="outline" className="text-orange-500 border-orange-500/50">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("unsaved")}
          </Badge>
        )}

        {/* 保存按钮 */}
        <Button
          size="sm"
          onClick={onSave}
          disabled={!canSave}
          className="gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t("save")}
            </>
          )}
        </Button>

        {/* 额外操作按钮 */}
        {extraActions}
      </div>
    </div>
  );
}
