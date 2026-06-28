"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PollingOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function usePolling<T>(url: string, { intervalMs = 5000, enabled = true }: PollingOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();

    const interval = setInterval(() => {
      if (!document.hidden) fetchData();
    }, intervalMs);

    const handleVisibility = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      abortRef.current?.abort();
    };
  }, [fetchData, intervalMs, enabled]);

  return { data, loading, error, refetch: fetchData };
}
