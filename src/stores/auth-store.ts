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
  role: "RECRUITER" | "APPLICANT" | 'ADMIN';
  emailVerified?: Date | null;
  image?: string | null;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthData: (user: User | null, profile: UserProfile | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      
      setAuthData: (user, profile) => set({ 
        user, 
        profile,
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setUser: (user) => set({ 
        user,
        isAuthenticated: !!user 
      }),
      
      setProfile: (profile) => set({ profile }),
      
      setIsLoading: (isLoading) => set({ isLoading }),
      
      reset: () => set({
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

export const useHydratedAuthStore = <T>(selector: (state: AuthState) => T) => {
  const store = useAuthStore(selector);
  const [data, setData] = useState(store);
  useEffect(() => {
    setData(store);
  }, [store]);
  return data;
};