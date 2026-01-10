/**
 * Loading overlay component for consistent loading states
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps {
  /** Whether the loading overlay is visible */
  isLoading: boolean;
  /** Loading message to display */
  message?: string;
  /** Size of the loader icon */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Children to render when not loading */
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
} as const;

/**
 * Loading overlay that can be used to show loading state over content
 * 
 * @example
 * ```tsx
 * <LoadingOverlay isLoading={isSubmitting} message="Saving...">
 *   <form>...</form>
 * </LoadingOverlay>
 * ```
 */
export function LoadingOverlay({
  isLoading,
  message,
  size = "md",
  className,
  children,
}: LoadingOverlayProps) {
  if (!isLoading && !children) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
            {message && (
              <p className="text-sm text-muted-foreground font-medium">
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}