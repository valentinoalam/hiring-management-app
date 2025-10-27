"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useCurrentUser, useSignOut } from "@/lib/queries/auth"
import type { User } from "@supabase/supabase-js"

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

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  recruiterProfile: RecruiterProfile | null
  jobSeekerProfile: JobSeekerProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null)
  const [jobSeekerProfile, setJobSeekerProfile] = useState<JobSeekerProfile | null>(null)

  const { data: currentUserData, isLoading: isLoadingUser } = useCurrentUser()
  const { mutateAsync: signOut } = useSignOut()

  useEffect(() => {
    if (currentUserData) {
      setUser(currentUserData.user)
      setProfile(currentUserData.profile)

      if (currentUserData.profile.role === "recruiter") {
        setRecruiterProfile(currentUserData.roleProfile)
        setJobSeekerProfile(null)
      } else {
        setJobSeekerProfile(currentUserData.roleProfile)
        setRecruiterProfile(null)
      }
    } else {
      setUser(null)
      setProfile(null)
      setRecruiterProfile(null)
      setJobSeekerProfile(null)
    }
  }, [currentUserData])

  const logout = async () => {
    await signOut()
    setUser(null)
    setProfile(null)
    setRecruiterProfile(null)
    setJobSeekerProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        recruiterProfile,
        jobSeekerProfile,
        isLoading: isLoadingUser,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
