import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMutationLoading } from './src/hooks/use-mutation-loading.ts';
import React from 'react';

// Simple debug test
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false, gcTime: 0 },
  },
});

const wrapper = ({ children }) => (
  React.createElement(QueryClientProvider, { client: queryClient }, children)
);

const mockFn = async (input) => {
  throw new Error("!");
};

const { result } = renderHook(
  () => useMutationLoading({ mutationFn: mockFn }),
  { wrapper }
);

console.log('Initial state:', {
  isLoading: result.current.isLoading,
  error: result.current.error,
  data: result.current.data
});

try {
  await act(async () => {
    await result.current.mutate("");
  });
} catch (error) {
  console.log('Caught error:', error.message);
}

console.log('Final state:', {
  isLoading: result.current.isLoading,
  error: result.current.error,
  data: result.current.data
});