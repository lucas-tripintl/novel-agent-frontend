"use client";

import { useEffect, useRef, useState, useCallback, useReducer } from "react";

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  shouldStop?: (data: T) => boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

interface UsePollingResult<T> {
  data: T | null;
  isPolling: boolean;
  error: Error | null;
  stop: () => void;
  restart: () => void;
}

export function usePolling<T>({
  fetcher,
  interval = 2000,
  enabled = true,
  onSuccess,
  onError,
  shouldStop,
  retryOnError = true,
  maxRetries = 3,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  // 使用 useReducer 来避免 React Compiler 的 setState 警告
  const [pollingState, dispatch] = useReducer(
    (state: { isPolling: boolean }, action: { type: 'start' | 'stop' }) => {
      switch (action.type) {
        case 'start':
          return { isPolling: true };
        case 'stop':
          return { isPolling: false };
        default:
          return state;
      }
    },
    { isPolling: false }
  );

  const { isPolling } = pollingState;
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retriesRef = useRef(0);
  const enabledRef = useRef(enabled);
  const stoppedRef = useRef(false);
  const pollRef = useRef<() => Promise<void>>(async () => {});

  // 更新 enabled ref
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const poll = useCallback(async () => {
    if (!enabledRef.current || stoppedRef.current) {
      dispatch({ type: 'stop' });
      return;
    }

    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      retriesRef.current = 0;
      onSuccess?.(result);

      if (shouldStop?.(result)) {
        dispatch({ type: 'stop' });
        return;
      }

      if (!stoppedRef.current) {
        timeoutRef.current = setTimeout(() => pollRef.current?.(), interval);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);

      if (retryOnError && retriesRef.current < maxRetries) {
        retriesRef.current++;
        // 指数退避
        const backoffInterval = interval * Math.pow(2, retriesRef.current);
        if (!stoppedRef.current) {
          timeoutRef.current = setTimeout(() => pollRef.current?.(), backoffInterval);
        }
      } else {
        dispatch({ type: 'stop' });
      }
    }
  }, [fetcher, interval, onSuccess, onError, shouldStop, retryOnError, maxRetries]);

  // 保持 pollRef 同步
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    dispatch({ type: 'stop' });
  }, []);

  const restart = useCallback(() => {
    stoppedRef.current = false;
    retriesRef.current = 0;
    dispatch({ type: 'start' });
    pollRef.current?.();
  }, []);

  // 使用单独的 effect 来处理 enabled 状态变化
  useEffect(() => {
    if (!enabled) {
      stoppedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [enabled]);

  // 使用单独的 effect 来启动轮询
  useEffect(() => {
    if (enabled && !stoppedRef.current) {
      dispatch({ type: 'start' });
      pollRef.current?.();
    } else if (!enabled) {
      dispatch({ type: 'stop' });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, poll, stop]);

  return { data, isPolling, error, stop, restart };
}
