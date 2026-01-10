"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DIALOG_SIZES, DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export interface BaseFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional dialog description */
  description?: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Dialog width size */
  maxWidth?: keyof typeof DIALOG_SIZES;
  /** Dialog content */
  children: React.ReactNode;
  /** Optional custom footer content */
  footer?: React.ReactNode;
  /** Whether the form is in loading state */
  loading?: boolean;
  /** Form submit handler */
  onSubmit?: (e: React.FormEvent) => void;
  /** Cancel button text */
  cancelText?: string;
  /** Submit button text */
  submitText?: string;
  /** Submit button variant */
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Whether to show the default footer */
  showDefaultFooter?: boolean;
  /** Additional className for content */
  className?: string;
}

/**
 * Base form dialog component providing consistent structure and behavior
 * for all dialog components in the application.
 * 
 * Features:
 * - Consistent header with title, optional icon, and description
 * - Scrollable content area with proper overflow handling
 * - Standardized footer with cancel/action buttons
 * - Loading state management with disabled interactions
 * - Keyboard navigation support (Enter to submit, Escape to close)
 * - Responsive sizing with predefined width options
 */
export function BaseFormDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  maxWidth = "lg",
  children,
  footer,
  loading = false,
  onSubmit,
  cancelText = "取消",
  submitText = "确认",
  submitVariant = "default",
  showDefaultFooter = true,
  className,
}: BaseFormDialogProps) {
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!loading && onSubmit) {
        onSubmit(e);
      }
    },
    [loading, onSubmit]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onSubmit && !loading) {
        e.preventDefault();
        const formEvent = new Event("submit", { bubbles: true, cancelable: true }) as any;
        handleSubmit(formEvent);
      }
    },
    [handleSubmit, onSubmit, loading]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(DIALOG_SIZES[maxWidth], className)}
        onKeyDown={handleKeyDown}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="shrink-0">
            <DialogTitle className={cn("flex items-center", DESIGN_TOKENS.gaps.sm)}>
              {Icon && <Icon className="h-5 w-5 text-primary" />}
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className={cn("flex-1 min-h-0", DESIGN_TOKENS.spacing.md)}>
            <ScrollArea className="h-full max-h-[60vh]">
              <div className="pr-4">
                {children}
              </div>
            </ScrollArea>
          </div>

          {(footer || showDefaultFooter) && (
            <DialogFooter className="shrink-0">
              {footer || (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    type="submit"
                    variant={submitVariant}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitText}
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}