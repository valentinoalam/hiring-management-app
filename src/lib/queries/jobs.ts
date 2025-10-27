"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface Job {
  id: string
  recruiterId: string
  title: string
  description: string | null
  department: string | null
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  employmentType: string | null
  status: "draft" | "active" | "inactive"
  createdAt: string
  updatedAt: string
  recruiter?: {
    email: string
    recruiterProfile?: {
      companyName: string | null
      fullName: string | null
    }
  }
  _count?: {
    applications: number
  }
}

export function useRecruiterJobs(recruiterId: string | undefined) {
  return useQuery({
    queryKey: ["recruiter-jobs", recruiterId],
    queryFn: async () => {
      const response = await fetch("/api/jobs")
      if (!response.ok) throw new Error("Failed to fetch jobs")
      return response.json() as Promise<Job[]>
    },
    enabled: !!recruiterId,
  })
}

export function useActiveJobs() {
  return useQuery({
    queryKey: ["active-jobs"],
    queryFn: async () => {
      const response = await fetch("/api/jobs?isActive=true")
      if (!response.ok) throw new Error("Failed to fetch active jobs")
      return response.json() as Promise<Job[]>
    },
  })
}

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!jobId) return null
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) throw new Error("Failed to fetch job")
      return response.json() as Promise<Job>
    },
    enabled: !!jobId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobData: Omit<Job, "id" | "createdAt" | "updatedAt" | "recruiterId">) => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      })
      if (!response.ok) throw new Error("Failed to create job")
      return response.json() as Promise<Job>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...jobData }: Partial<Job> & { id: string }) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      })
      if (!response.ok) throw new Error("Failed to update job")
      return response.json() as Promise<Job>
    },
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["job", updatedJob.id] })
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete job")
      return jobId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] })
      queryClient.invalidateQueries({ queryKey: ["active-jobs"] })
    },
  })
}
