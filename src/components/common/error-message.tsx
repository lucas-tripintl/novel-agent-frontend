"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  variant?: "error" | "warning" | "info" | "success";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

/**
 * Standardized error message component for inline display
 * Provides consistent error messaging with proper styling and icons
 */
export function ErrorMessage({
  message,
  variant = "error",
  size = "md",
  className = "",
  showIcon = true,
}: ErrorMessageProps) {
  const icons = {
    error: AlertTriangle,
    warning: AlertCircle,
    info: Info,
    success: CheckCircle,
  };

  const variants = {
    error: "destructive",
    warning: "default",
    info: "default",
    success: "default",
  } as const;

  const colors = {
    error: "text-destructive",
    warning: "text-orange-600",
    info: "text-blue-600",
    success: "text-green-600",
  };

  const sizes = {
    sm: {
      icon: "h-3 w-3",
      text: "text-xs",
      padding: "p-2",
    },
    md: {
      icon: "h-4 w-4",
      text: "text-sm",
      padding: "p-3",
    },
    lg: {
      icon: "h-5 w-5",
      text: "text-base",
      padding: "p-4",
    },
  };

  const Icon = icons[variant];
  const sizeConfig = sizes[size];

  return (
    <Alert 
      variant={variants[variant]} 
      className={cn(sizeConfig.padding, className)}
    >
      {showIcon && (
        <Icon className={cn(sizeConfig.icon, colors[variant])} />
      )}
      <AlertDescription className={cn(sizeConfig.text, colors[variant])}>
        {message}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact error message for form fields
 */
export function FieldErrorMessage({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 text-xs text-destructive mt-1", className)}>
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Error message for empty states or large content areas
 */
export function EmptyStateError({
  title = "Something went wrong",
  message,
  onRetry,
  className = "",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2 text-destructive">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary hover:text-primary/80 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}