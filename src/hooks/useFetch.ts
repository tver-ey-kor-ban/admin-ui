import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../core/api/apiClient';
import type { AxiosRequestConfig } from 'axios';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string | null, config?: AxiosRequestConfig): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<T>(url, { ...config, signal: controller.signal });
      setData(res.data);
    } catch (e: unknown) {
      if ((e as { name?: string }).name === 'CanceledError') return;
      const msg =
        (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        (e instanceof Error ? e.message : 'Failed to load data');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
