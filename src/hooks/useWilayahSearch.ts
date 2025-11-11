// hooks/useWilayahSearch.ts
import { useState, useCallback } from 'react';

interface WilayahItem {
  kode: string;
  nama: string;
  tipe: string;
}

interface SearchResult {
  success: boolean;
  data: WilayahItem[];
  meta: {
    query: string;
    limit: number;
    total: number;
  };
  error?: string;
}

export const useWilayahSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, limit: number = 10): Promise<WilayahItem[]> => {
    if (!query.trim()) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wilayah/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result: SearchResult = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    search,
    loading,
    error
  };
};