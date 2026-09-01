import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface RealTimeUpdateConfig {
  enabled: boolean;
  interval?: number;
  endpoints: string[];
  onUpdate?: (data: any) => void;
}

export function useRealTimeUpdates(config: RealTimeUpdateConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!config.enabled) return;

    try {
      const responses = await Promise.all(
        config.endpoints.map((endpoint) => apiClient.get(endpoint))
      );

      const data = responses.map((response, index) => ({
        endpoint: config.endpoints[index],
        data: response.data,
        error: response.error,
      }));

      if (config.onUpdate) {
        config.onUpdate(data);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch updates');
      console.error('Real-time update error:', err);
    }
  }, [config.enabled, config.endpoints, config.onUpdate]);

  useEffect(() => {
    if (!config.enabled) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    fetchData(); // Initial fetch

    const interval = setInterval(fetchData, config.interval || 30000); // Default 30 seconds

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [config.enabled, config.interval, fetchData]);

  return {
    isConnected,
    lastUpdate,
    error,
    refresh: fetchData,
  };
}