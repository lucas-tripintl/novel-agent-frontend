/**
 * Button component with consistent loading state
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export interface LoadingButtonProps extends 
  Omit<React.ComponentProps<"button">, "disabled">,
  VariantProps<typeof buttonVariants> {
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Text to show when loading (optional) */
  loadingText?: string;
  /** Whether to disable the button when loading */
  disabled?: boolean;
  /** Whether to render as child component */
  asChild?: boolean;
}

/**
 * Button component that shows loading state with Loader2 icon
 * 
 * @example
 * ```tsx
 * <LoadingButton 
 *   loading={isSubmitting} 
 *   loadingText="Saving..."
 *   onClick={handleSubmit}
 * >
 *   Save Project
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  children,
  className,
  variant,
  size,
  asChild,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Button
      disabled={isDisabled}
      className={className}
      variant={variant}
      size={size}
      asChild={asChild}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}