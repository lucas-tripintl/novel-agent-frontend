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
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";

interface ConfirmLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onSave?: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

export function ConfirmLeaveDialog({
  open,
  onOpenChange,
  title = "有未保存的更改",
  description = "你有未保存的更改，是否保存后再离开？",
  onSave,
  onDiscard,
  isSaving = false,
}: ConfirmLeaveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>取消</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              onDiscard();
              onOpenChange(false);
            }}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            放弃更改
          </Button>
          {onSave && (
            <AlertDialogAction
              onClick={() => {
                onSave();
                onOpenChange(false);
              }}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Save className="h-4 w-4" />
              保存并离开
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
