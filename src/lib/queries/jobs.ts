"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface Job {
  id: string
  recruiter_id: string
  title: string
  description: string
  department: string
  location: string
  salary_min: number | null
  salary_max: number | null
  employment_type: string
  status: "draft" | "active" | "inactive"
  created_at: string
  updated_at: string
}

// Fetch all jobs for a recruiter
export function useRecruiterJobs(recruiterId: string | undefined) {
  return useQuery({
    queryKey: ["recruiter-jobs", recruiterId],
    queryFn: async () => {
      if (!recruiterId) return []
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", recruiterId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Job[]
    },
    enabled: !!recruiterId,
  })
}

// Fetch all active jobs for job seekers
export function useActiveJobs() {
  return useQuery({
    queryKey: ["active-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Job[]
    },
  })
}

// Fetch a single job
export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!jobId) return null
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single()

      if (error) throw error
      return data as Job
    },
    enabled: !!jobId,
  })
}

// Create a new job
export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobData: Omit<Job, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("jobs").insert([jobData]).select().single()

      if (error) throw error
      return data as Job
    },
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs", newJob.recruiter_id] })
    },
  })
}

// Update a job
export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...jobData }: Partial<Job> & { id: string }) => {
      const { data, error } = await supabase.from("jobs").update(jobData).eq("id", id).select().single()

      if (error) throw error
      return data as Job
    },
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["job", updatedJob.id] })
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] })
    },
  })
}

// Delete a job
export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId)

      if (error) throw error
      return jobId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] })
      queryClient.invalidateQueries({ queryKey: ["active-jobs"] })
    },
  })
}
