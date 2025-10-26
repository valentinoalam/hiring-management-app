"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
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
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (currentUser) {
          setUser(currentUser)

          // Fetch user profile
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()

          if (profileData) {
            setProfile(profileData)

            // Fetch role-specific profile
            if (profileData.role === "recruiter") {
              const { data: recruiterData } = await supabase
                .from("recruiter_profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single()

              if (recruiterData) {
                setRecruiterProfile(recruiterData)
              }
            } else {
              const { data: jobSeekerData } = await supabase
                .from("job_seeker_profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single()

              if (jobSeekerData) {
                setJobSeekerProfile(jobSeekerData)
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)

        // Fetch updated profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        if (profileData) {
          setProfile(profileData)

          if (profileData.role === "recruiter") {
            const { data: recruiterData } = await supabase
              .from("recruiter_profiles")
              .select("*")
              .eq("id", session.user.id)
              .single()

            setRecruiterProfile(recruiterData || null)
          } else {
            const { data: jobSeekerData } = await supabase
              .from("job_seeker_profiles")
              .select("*")
              .eq("id", session.user.id)
              .single()

            setJobSeekerProfile(jobSeekerData || null)
          }
        }
      } else {
        setUser(null)
        setProfile(null)
        setRecruiterProfile(null)
        setJobSeekerProfile(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
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
        isLoading,
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
