"use client"

import { User } from "next-auth"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserProfile {
  id: string
  role: "recruiter" | "job_seeker"
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
)
