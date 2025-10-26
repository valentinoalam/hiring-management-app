"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useMemo } from "react"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"

// Define the settings type
export interface Settings {
  localQuota: number
  freeQuota: number
  womanRatio: string
  registrationOpenDate: string;  // Format: "YYYY-MM-DD"
  registrationClosedDate: string;
  itikafStartDate: string
  attendanceOpenTime: string
  attendanceCloseTime: string
}

// Default settings
const defaultSettings: Settings = {
  localQuota: 0,
  freeQuota: 0,
  womanRatio: "",
  registrationOpenDate: "",
  registrationClosedDate: "",
  itikafStartDate: "",
  attendanceOpenTime: "",
  attendanceCloseTime: "",
}

// Context type
interface SettingsContextType {
  settings: Settings
  isLoading: boolean
  error: string | null
  updateSettings: (newSettings: Settings) => Promise<void>
  refreshSettings: () => Promise<void>
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return ""; // Handle missing dates
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

// Create the context
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => 
    getLocalStorage("itikaf_settings", defaultSettings)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize API endpoint
  const apiEndpoint = useMemo(() => 
    `${process.env.NEXT_PUBLIC_BACKEND_URL || "/api"}/itikaf/settings`,
    []
  );

  // Unified API request handler
  const handleApiRequest = useCallback(async <T,>(
    method: 'GET' | 'PUT',
    options: RequestInit = {},
    data?: Settings,
  ): Promise<T> => {
    const response = await fetch(apiEndpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to ${method} settings`);
    }

    return response.json();
  }, [apiEndpoint]);

  // Fetch settings with abort controller
  const fetchSettings = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await handleApiRequest<Settings>('GET', { signal });

      const formattedSettings = {
        ...data,
        itikafStartDate: formatDate(data.itikafStartDate),
        registrationOpenDate: formatDate(data.registrationOpenDate),
        registrationClosedDate: formatDate(data.registrationClosedDate),
      };

      setSettings(prev => {
        if (JSON.stringify(formattedSettings) === JSON.stringify(prev)) return prev;
        setLocalStorage("itikaf_settings", formattedSettings);
        return formattedSettings;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // Handle abort safely
      console.error("Error fetching settings:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [handleApiRequest]);


  // Optimized settings update
  const updateSettings = useCallback(async (newSettings: Settings) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedData = await handleApiRequest<Settings>('PUT', {}, newSettings);
      
      setSettings(prev => {
        if (JSON.stringify(updatedData) === JSON.stringify(prev)) return prev;
        setLocalStorage("itikaf_settings", updatedData);
        return updatedData;
      });
    } catch (err) {
      console.error("Error updating settings:", err);
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiRequest]);

  // Fetch on mount with cleanup
  useEffect(() => {
    const abortController = new AbortController();
    fetchSettings(abortController.signal);
    return () => abortController.abort();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// Hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

