/**
 * Custom hook for mutation loading state management
 * 
 * This hook addresses the React Query race condition issue where mutation.isPending
 * may not reset correctly after mutateAsync(). It uses local state management
 * to provide reliable loading state tracking.
 */

import { useState, useCallback } from "react";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

export interface UseMutationLoadingOptions<TData, TError, TVariables, TContext = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  retry?: UseMutationOptions<TData, TError, TVariables, TContext>["retry"];
  retryDelay?: UseMutationOptions<TData, TError, TVariables, TContext>["retryDelay"];
}

export interface UseMutationLoadingReturn<TData, TError, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateSync: (variables: TVariables) => void;
  isLoading: boolean;
  error: TError | null;
  data: TData | undefined;
  reset: () => void;
}

/**
 * Hook that provides mutation functionality with reliable loading state management
 * 
 * @param options - Mutation configuration options
 * @returns Object with mutate function, loading state, error, and data
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useMutationLoading({
 *   mutationFn: (data: CreateProjectData) => createProject(data),
 *   onSuccess: () => {
 *     toast.success("Project created successfully");
 *     queryClient.invalidateQueries({ queryKey: ["projects"] });
 *   },
 *   onError: (error) => {
 *     toast.error(`Failed to create project: ${error.message}`);
 *   },
 * });
 * 
 * const handleSubmit = async (formData: CreateProjectData) => {
 *   try {
 *     await mutate(formData);
 *     onClose();
 *   } catch (error) {
 *     // Error is already handled by onError callback
 *   }
 * };
 * ```
 */
export function useMutationLoading<TData, TError, TVariables, TContext = unknown>(
  options: UseMutationLoadingOptions<TData, TError, TVariables, TContext>
): UseMutationLoadingReturn<TData, TError, TVariables> {
  const [isLoading, setIsLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: options.mutationFn,
    onMutate: options.onMutate,
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSettled: options.onSettled,
    retry: options.retry,
    retryDelay: options.retryDelay,
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      try {
        const result = await mutation.mutateAsync(variables);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [mutation]
  );

  const mutateSync = useCallback(
    (variables: TVariables): void => {
      setIsLoading(true);
      mutation.mutate(variables, {
        onSettled: () => {
          setIsLoading(false);
        },
      });
    },
    [mutation]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    mutation.reset();
  }, [mutation]);

  return {
    mutate,
    mutateSync,
    isLoading,
    error: mutation.error,
    data: mutation.data,
    reset,
  };
}