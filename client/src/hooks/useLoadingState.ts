import { useState, useCallback } from "react";
import type { LoadingState } from "../types";

interface UseLoadingStateReturn {
  loadingState: LoadingState;
  setIdle: () => void;
  setLoading: () => void;
  setSuccess: () => void;
  setError: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

export function useLoadingState(initialState: LoadingState = "idle"): UseLoadingStateReturn {
  const [loadingState, setLoadingState] = useState<LoadingState>(initialState);

  const setIdle = useCallback(() => setLoadingState("idle"), []);
  const setLoading = useCallback(() => setLoadingState("loading"), []);
  const setSuccess = useCallback(() => setLoadingState("success"), []);
  const setError = useCallback(() => setLoadingState("error"), []);

  return {
    loadingState,
    setIdle,
    setLoading,
    setSuccess,
    setError,
    isLoading: loadingState === "loading",
    isSuccess: loadingState === "success",
    isError: loadingState === "error",
    isIdle: loadingState === "idle",
  };
}
