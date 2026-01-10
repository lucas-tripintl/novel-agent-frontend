/**
 * Tests for useDeleteWithConfirmation hook
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDeleteWithConfirmation } from "./use-delete-with-confirmation";
import React, { ReactNode } from "react";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the ConfirmDeleteDialog component
vi.mock("@/components/common/confirm-delete-dialog", () => ({
  ConfirmDeleteDialog: ({ children, ...props }: any) =>
    React.createElement("div", { "data-testid": "confirm-delete-dialog", ...props }, children),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: { 
        retry: false,
        gcTime: 0,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useDeleteWithConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct default state", () => {
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(
      () => useDeleteWithConfirmation({
        targetName: "测试项目",
        deleteFn: mockDeleteFn,
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.showConfirmDialog).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(typeof result.current.setShowConfirmDialog).toBe("function");
    expect(typeof result.current.handleDelete).toBe("function");
    expect(typeof result.current.ConfirmDialog).toBe("function");
  });

  it("should manage dialog state correctly", () => {
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(
      () => useDeleteWithConfirmation({
        targetName: "测试项目",
        deleteFn: mockDeleteFn,
      }),
      { wrapper: createWrapper() }
    );

    // Initially closed
    expect(result.current.showConfirmDialog).toBe(false);

    // Open dialog
    act(() => {
      result.current.setShowConfirmDialog(true);
    });
    expect(result.current.showConfirmDialog).toBe(true);

    // Close dialog
    act(() => {
      result.current.setShowConfirmDialog(false);
    });
    expect(result.current.showConfirmDialog).toBe(false);
  });

  it("should execute delete operation successfully", async () => {
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined);
    const mockOnSuccess = vi.fn();
    
    const { result } = renderHook(
      () => useDeleteWithConfirmation({
        targetName: "测试项目",
        deleteFn: mockDeleteFn,
        onSuccess: mockOnSuccess,
      }),
      { wrapper: createWrapper() }
    );

    // Open dialog first
    act(() => {
      result.current.setShowConfirmDialog(true);
    });

    // Execute delete
    await act(async () => {
      await result.current.handleDelete();
    });

    expect(mockDeleteFn).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    
    // Dialog should be closed after successful deletion
    await waitFor(() => {
      expect(result.current.showConfirmDialog).toBe(false);
    });
  });

  it("should handle delete operation errors", async () => {
    const mockError = new Error("Delete failed");
    const mockDeleteFn = vi.fn().mockRejectedValue(mockError);
    const mockOnError = vi.fn();
    
    const { result } = renderHook(
      () => useDeleteWithConfirmation({
        targetName: "测试项目",
        deleteFn: mockDeleteFn,
        onError: mockOnError,
      }),
      { wrapper: createWrapper() }
    );

    // Execute delete
    await act(async () => {
      await result.current.handleDelete();
    });

    expect(mockDeleteFn).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it("should manage loading state correctly", async () => {
    let resolveDelete: () => void;
    const mockDeleteFn = vi.fn(() => new Promise<void>((resolve) => {
      resolveDelete = resolve;
    }));
    
    const { result } = renderHook(
      () => useDeleteWithConfirmation({
        targetName: "测试项目",
        deleteFn: mockDeleteFn,
      }),
      { wrapper: createWrapper() }
    );

    // Initially not loading
    expect(result.current.isDeleting).toBe(false);

    // Start delete operation
    act(() => {
      result.current.handleDelete();
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current.isDeleting).toBe(true);
    });

    // Complete delete operation
    await act(async () => {
      resolveDelete!();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should not be loading anymore
    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });
  });

  it("should render ConfirmDialog component with correct props", () => {
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(
      () => useDeleteWithConfirmation({
        targetName: "测试项目",
        deleteFn: mockDeleteFn,
        actionLabel: "删除",
      }),
      { wrapper: createWrapper() }
    );

    const ConfirmDialog = result.current.ConfirmDialog;
    expect(typeof ConfirmDialog).toBe("function");
  });
});