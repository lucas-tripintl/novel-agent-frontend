"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorFallbackProps {
  error: Error;
  retry?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Compact error fallback component for smaller UI areas
 * Provides consistent error display with optional retry functionality
 */
export function ErrorFallback({ 
  error, 
  retry, 
  compact = false,
  className = ""
}: ErrorFallbackProps) {
  if (compact) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            {error.message || "Something went wrong"}
          </span>
          {retry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={retry}
              className="h-6 px-2 ml-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
      <h4 className="text-sm font-medium mb-2">Error occurred</h4>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs">
        {error.message || "An unexpected error occurred"}
      </p>
      {retry && (
        <Button onClick={retry} variant="outline" size="sm">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Inline error message component for form fields and small UI elements
 */
export function InlineError({ 
  message, 
  className = "" 
}: { 
  message: string; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center gap-1 text-xs text-destructive ${className}`}>
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </div>
  );
}