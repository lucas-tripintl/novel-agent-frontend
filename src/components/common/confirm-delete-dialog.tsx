"use client";

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
import { Loader2, Trash2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 删除目标名称，如 "角色「萧炎」" */
  targetName: string;
  /** 删除按钮文字，默认 "删除" */
  actionLabel?: string;
  /** 执行删除 */
  onConfirm: () => Promise<void> | void;
  /** 是否正在删除 */
  isPending?: boolean;
  /** 自定义内容，显示在描述和按钮之间 */
  children?: React.ReactNode;
}

/**
 * 通用删除确认对话框
 *
 * @example
 * ```tsx
 * <ConfirmDeleteDialog
 *   open={showDelete}
 *   onOpenChange={setShowDelete}
 *   targetName={`角色「${character.name}」`}
 *   onConfirm={handleDelete}
 *   isPending={deleteMutation.isPending}
 * />
 * ```
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  targetName,
  actionLabel = "删除",
  onConfirm,
  isPending = false,
  children,
}: ConfirmDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <AlertDialogContent onCloseOnOutsideClick={isPending ? undefined : () => onOpenChange(false)}>
        <AlertDialogHeader>
          <AlertDialogTitle>确认{actionLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            确定要{actionLabel} {targetName} 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
