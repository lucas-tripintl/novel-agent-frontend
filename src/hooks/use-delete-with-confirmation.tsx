/**
 * Custom hook for standardized delete operations with confirmation dialog
 * 
 * This hook provides a consistent delete flow across the application, including:
 * - Confirmation dialog management
 * - Loading state handling using local state (avoiding React Query race conditions)
 * - Error handling with toast notifications
 * - Success callbacks for data refresh
 */

import React, { useState, useCallback } from "react";
import { useMutationLoading } from "./use-mutation-loading";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { toast } from "sonner";

export interface UseDeleteWithConfirmationOptions {
  /** Display name of the item being deleted (e.g., "项目「My Novel」") */
  targetName: string;
  /** Function that performs the delete operation */
  deleteFn: () => Promise<void>;
  /** Callback executed after successful deletion */
  onSuccess?: () => void;
  /** Callback executed when deletion fails */
  onError?: (error: Error) => void;
  /** Custom delete button label (defaults to "删除") */
  actionLabel?: string;
}

export interface UseDeleteWithConfirmationReturn {
  /** Whether the confirmation dialog is currently shown */
  showConfirmDialog: boolean;
  /** Function to show/hide the confirmation dialog */
  setShowConfirmDialog: (show: boolean) => void;
  /** Function to execute the delete operation */
  handleDelete: () => Promise<void>;
  /** Whether the delete operation is currently in progress */
  isDeleting: boolean;
  /** Pre-configured ConfirmDialog component */
  ConfirmDialog: React.ComponentType<{ children?: React.ReactNode }>;
}

/**
 * Hook that provides standardized delete confirmation flow
 * 
 * @param options - Configuration for the delete operation
 * @returns Object with dialog state, delete handler, and ConfirmDialog component
 * 
 * @example
 * ```tsx
 * const { 
 *   showConfirmDialog, 
 *   setShowConfirmDialog, 
 *   handleDelete, 
 *   isDeleting, 
 *   ConfirmDialog 
 * } = useDeleteWithConfirmation({
 *   targetName: `项目「${project.name}」`,
 *   deleteFn: () => deleteProject(project.id),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: ["projects"] });
 *     toast.success("项目删除成功");
 *   },
 *   onError: (error) => {
 *     toast.error(`删除失败: ${error.message}`);
 *   },
 * });
 * 
 * // In component JSX:
 * <Button 
 *   variant="destructive" 
 *   onClick={() => setShowConfirmDialog(true)}
 *   disabled={isDeleting}
 * >
 *   删除项目
 * </Button>
 * 
 * <ConfirmDialog />
 * ```
 */
export function useDeleteWithConfirmation({
  targetName,
  deleteFn,
  onSuccess,
  onError,
  actionLabel = "删除",
}: UseDeleteWithConfirmationOptions): UseDeleteWithConfirmationReturn {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Use useMutationLoading for reliable loading state management
  const { mutate: executeDelete, isLoading: isDeleting } = useMutationLoading({
    mutationFn: () => deleteFn(), // Wrap deleteFn to match expected signature
    onSuccess: () => {
      setShowConfirmDialog(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error : new Error("删除操作失败");
      onError?.(errorMessage);
    },
  });

  const handleDelete = useCallback(async () => {
    try {
      await executeDelete(undefined); // Pass undefined as variables since deleteFn doesn't need them
    } catch (error) {
      // Error is already handled by the mutation's onError callback
      // This catch block prevents unhandled promise rejections
    }
  }, [executeDelete]);

  // Pre-configured ConfirmDialog component
  const ConfirmDialog = useCallback(
    ({ children }: { children?: React.ReactNode }) => (
      <ConfirmDeleteDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        targetName={targetName}
        actionLabel={actionLabel}
        onConfirm={handleDelete}
        isPending={isDeleting}
      >
        {children}
      </ConfirmDeleteDialog>
    ),
    [showConfirmDialog, targetName, actionLabel, handleDelete, isDeleting]
  );

  return {
    showConfirmDialog,
    setShowConfirmDialog,
    handleDelete,
    isDeleting,
    ConfirmDialog,
  };
}