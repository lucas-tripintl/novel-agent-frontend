/**
 * Standardized error handling hook
 * Provides consistent error handling patterns across components
 */

import { useCallback } from "react";
import { errorToast, warningToast } from "@/lib/utils/toast";
import { ApiError, BusinessError } from "@/lib/api/client";

/**
 * Error handling options
 */
interface ErrorHandlerOptions {
  showToast?: boolean;
  customMessage?: string;
  onError?: (error: Error) => void;
}

/**
 * Hook for standardized error handling
 */
export function useErrorHandler() {
  /**
   * Handle mutation errors with consistent toast notifications
   */
  const handleMutationError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, customMessage, onError } = options;

    let message = customMessage || "An error occurred";

    if (error instanceof BusinessError) {
      message = error.msg || `Error code: ${error.code}`;
    } else if (error instanceof ApiError) {
      message = `Request failed: ${error.status} ${error.statusText}`;
    } else if (error instanceof Error) {
      message = error.message;
    }

    if (showToast) {
      errorToast.mutation(message);
    }

    if (onError && error instanceof Error) {
      onError(error);
    }

    console.error("Mutation error:", error);
  }, []);

  /**
   * Handle network errors with consistent messaging
   */
  const handleNetworkError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, customMessage, onError } = options;

    const message = customMessage || "Network error. Please check your connection.";

    if (showToast) {
      errorToast.network(message);
    }

    if (onError && error instanceof Error) {
      onError(error);
    }

    console.error("Network error:", error);
  }, []);

  /**
   * Handle validation errors with consistent styling
   */
  const handleValidationError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, customMessage, onError } = options;

    let message = customMessage || "Validation failed";

    if (error instanceof BusinessError) {
      message = error.msg || message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    if (showToast) {
      errorToast.validation(message);
    }

    if (onError && error instanceof Error) {
      onError(error);
    }

    console.error("Validation error:", error);
  }, []);

  /**
   * Handle general errors with default styling
   */
  const handleGeneralError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, customMessage, onError } = options;

    let message = customMessage || "An unexpected error occurred";

    if (error instanceof Error) {
      message = error.message;
    }

    if (showToast) {
      errorToast.general(message);
    }

    if (onError && error instanceof Error) {
      onError(error);
    }

    console.error("General error:", error);
  }, []);

  /**
   * Handle rate limit errors with warning styling
   */
  const handleRateLimitError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, customMessage, onError } = options;

    let message = customMessage || "Rate limit exceeded. Please try again later.";

    if (error instanceof BusinessError) {
      message = error.msg || message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    if (showToast) {
      warningToast.general(message);
    }

    if (onError && error instanceof Error) {
      onError(error);
    }

    console.warn("Rate limit error:", error);
  }, []);

  return {
    handleMutationError,
    handleNetworkError,
    handleValidationError,
    handleGeneralError,
    handleRateLimitError,
  };
}