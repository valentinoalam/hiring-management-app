"use client"

import { User } from "next-auth"
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

interface RecruiterProfile {
  id: string
  company_name: string | null
  full_name: string | null
  phone: string | null
  profile_image_url: string | null
  created_at: string
  updated_at: string
}

interface JobSeekerProfile {
  id: string
  full_name: string | null
  phone: string | null
  location: string | null
  bio: string | null
  profile_image_url: string | null
  resume_url: string | null
  portfolio_url: string | null
  profile_completion_percentage: number
  created_at: string
  updated_at: string
}

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  // preferences: UserPreferences;
  // Action to set data from the Server Component
  setSessionData: (
    data: { 
      userId: string; 
      // preferences: UserPreferences 
    },
  ) => void;
  // Action to update preferences on the client (and then sync to server/db)
  // updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  user: User | null
  profile: UserProfile | null
  recruiterProfile: RecruiterProfile | null
  jobSeekerProfile: JobSeekerProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setRecruiterProfile: (profile: RecruiterProfile | null) => void
  setJobSeekerProfile: (profile: JobSeekerProfile | null) => void
  setIsLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      recruiterProfile: null,
      jobSeekerProfile: null,
      isLoading: true,
      isAuthenticated: false,
      isLoggedIn: false,
      userId: null,
      preferences: { theme: 'light', language: 'en' },
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
      setRecruiterProfile: (recruiterProfile) => set({ recruiterProfile }),
      setJobSeekerProfile: (jobSeekerProfile) => set({ jobSeekerProfile }),
      setIsLoading: (isLoading) => set({ isLoading }),
      reset: () =>
        set({
          user: null,
          profile: null,
          recruiterProfile: null,
          jobSeekerProfile: null,
          isLoading: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        recruiterProfile: state.recruiterProfile,
        jobSeekerProfile: state.jobSeekerProfile,
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