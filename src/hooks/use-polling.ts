"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retriesRef = useRef(0);
  const enabledRef = useRef(enabled);
  const stoppedRef = useRef(false);

  // 更新 enabled ref
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const poll = useCallback(async () => {
    if (!enabledRef.current || stoppedRef.current) {
      setIsPolling(false);
      return;
    }

    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      retriesRef.current = 0;
      onSuccess?.(result);

      if (shouldStop?.(result)) {
        setIsPolling(false);
        return;
      }

      if (!stoppedRef.current) {
        timeoutRef.current = setTimeout(poll, interval);
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
          timeoutRef.current = setTimeout(poll, backoffInterval);
        }
      } else {
        setIsPolling(false);
      }
    }
  }, [fetcher, interval, onSuccess, onError, shouldStop, retryOnError, maxRetries]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPolling(false);
  }, []);

  const restart = useCallback(() => {
    stoppedRef.current = false;
    retriesRef.current = 0;
    setIsPolling(true);
    poll();
  }, [poll]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    stoppedRef.current = false;
    setIsPolling(true);
    poll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, poll, stop]);

  return { data, isPolling, error, stop, restart };
}
