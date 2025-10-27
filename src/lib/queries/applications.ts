"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface Application {
  id: string
  jobId: string
  jobSeekerId: string
  status: "pending" | "reviewed" | "accepted" | "rejected"
  appliedAt: string
  createdAt: string
  updatedAt: string
  job?: {
    id: string
    title: string
    department: string | null
    recruiter?: {
      recruiterProfile?: {
        companyName: string | null
      }
    }
  }
  jobSeeker?: {
    email: string
    jobSeekerProfile?: {
      fullName: string | null
      phone: string | null
      location: string | null
    }
  }
  applicationResponses?: ApplicationResponse[]
}

export interface ApplicationResponse {
  id: string
  applicationId: string
  fieldId: string
  responseValue: string | null
  createdAt: string
  updatedAt: string
  field?: {
    id: string
    fieldName: string
    fieldType: string
    fieldState: string
  }
}

export function useJobApplications(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      if (!jobId) return []
      const response = await fetch(`/api/applications?jobId=${jobId}&role=recruiter`)
      if (!response.ok) throw new Error("Failed to fetch applications")
      return response.json() as Promise<Application[]>
    },
    enabled: !!jobId,
  })
}

export function useJobSeekerApplications() {
  return useQuery({
    queryKey: ["job-seeker-applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications?role=job_seeker")
      if (!response.ok) throw new Error("Failed to fetch applications")
      return response.json() as Promise<Application[]>
    },
  })
}

export function useApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      if (!applicationId) return null
      const response = await fetch(`/api/applications/${applicationId}`)
      if (!response.ok) throw new Error("Failed to fetch application")
      return response.json() as Promise<Application>
    },
    enabled: !!applicationId,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appData: { jobId: string; responses: Array<{ fieldId: string; responseValue: string }> }) => {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create application")
      }
      return response.json() as Promise<Application>
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", newApp.jobId] })
      queryClient.invalidateQueries({ queryKey: ["job-seeker-applications"] })
    },
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Failed to update application")
      return response.json() as Promise<Application>
    },
    onSuccess: (updatedApp) => {
      queryClient.invalidateQueries({ queryKey: ["application", updatedApp.id] })
      queryClient.invalidateQueries({ queryKey: ["job-applications"] })
    },
  })
}
