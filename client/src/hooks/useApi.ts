import { useState, useCallback } from "react";
import type { ApiError } from "../types";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiReturn<T, P extends any[]> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T, P extends any[] = []>(
  apiFunction: (...params: P) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...params);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const apiError: ApiError = {
          code: (err as any)?.response?.status || (err as any)?.code || 500,
          error: (err as any)?.response?.statusText || "Error",
          message: err instanceof Error ? err.message : "An error occurred",
        };
        setError(apiError);
        options.onError?.(apiError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}
