"use client"

import { useEffect, useState } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserProfile {
  id: string
  role: "RECRUITER" | "APPLICANT"
  email: string
  created_at: string
  updated_at: string
}

interface User {
  id: string;
  email?: string;
  name?: string | null;
  role: "RECRUITER" | "APPLICANT" | 'ADMIN'; // Ensure all UserRole types are covered
  emailVerified?: Date | null;
  image?: string | null;
}
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  userId: string | null;
  // preferences: UserPreferences;
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  setSessionData: (
    data: { 
      userId: string; 
      // preferences: UserPreferences 
    },
  ) => void;
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setIsLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      isLoggedIn: false,
      authUserData: null,
      // preferences: { theme: 'light', language: 'en' },
      setSessionData: (data) => set({ 
          isLoggedIn: !!data.userId, 
          userId: data.userId, 
          // preferences: data.preferences 
      }),
      // updatePreferences: (newPrefs) => set((state) => ({
      //   preferences: { ...state.preferences, ...newPrefs }
      //   // NOTE: A Server Action/API call is required here to sync to Prisma/DB
      // })),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setIsLoading: (isLoading) => set({ isLoading }),
      reset: () =>
        set({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
      }),
    },
  ),
);
// Custom hook to handle hydration in Next.js
export const useHydratedAuthStore = <T>(selector: (state: AuthState) => T) => {
  const store = useAuthStore(selector);
  const [data, setData] = useState(store);
  useEffect(() => {
    setData(store);
  }, [store]);
  return data;
};