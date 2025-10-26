"use client"

import { useAuth } from "./auth-context"

export function useUser() {
  const { user, isLoading } = useAuth()
  return { user, isLoading }
}

export function useProfile() {
  const { profile, isLoading } = useAuth()
  return { profile, isLoading }
}

export function useRecruiterProfile() {
  const { recruiterProfile, isLoading } = useAuth()
  return { recruiterProfile, isLoading }
}

export function useJobSeekerProfile() {
  const { jobSeekerProfile, isLoading } = useAuth()
  return { jobSeekerProfile, isLoading }
}

export function useIsRecruiter() {
  const { profile, isLoading } = useAuth()
  return { isRecruiter: profile?.role === "recruiter", isLoading }
}

export function useIsJobSeeker() {
  const { profile, isLoading } = useAuth()
  return { isJobSeeker: profile?.role === "job_seeker", isLoading }
}

export function useLogout() {
  const { logout } = useAuth()
  return logout
}
