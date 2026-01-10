import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMutationLoading } from './use-mutation-loading';
import React, { ReactNode } from 'react';

// Create a wrapper component for React Query
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
  
  return ({ children }: { children: ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useMutationLoading', () => {
  test('should handle successful mutation', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const wrapper = createWrapper();
    
    const { result } = renderHook(
      () => useMutationLoading({ mutationFn: mockFn }),
      { wrapper }
    );

    // Initial state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(undefined);

    // Execute mutation
    let mutationResult: any;
    await act(async () => {
      mutationResult = await result.current.mutate('test');
    });

    // Check final state
    expect(result.current.isLoading).toBe(false);
    expect(mutationResult).toBe('success');
    expect(result.current.data).toBe('success');
    expect(result.current.error).toBe(null);
  });

  test('should handle failed mutation', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('test error'));
    const wrapper = createWrapper();
    
    const { result } = renderHook(
      () => useMutationLoading({ mutationFn: mockFn }),
      { wrapper }
    );

    // Initial state
    expect(result.current.isLoading).toBe(false);

    // Execute mutation
    let mutationError: any;
    await act(async () => {
      try {
        await result.current.mutate('test');
      } catch (error) {
        mutationError = error;
      }
    });

    // Check final state
    expect(result.current.isLoading).toBe(false);
    expect(mutationError).toEqual(expect.objectContaining({ message: 'test error' }));
    
    // Wait for error to be set in hook state
    await waitFor(() => {
      expect(result.current.error).toEqual(expect.objectContaining({ message: 'test error' }));
    });
  });
});