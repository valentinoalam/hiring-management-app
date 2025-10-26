"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: "pending" | "reviewed" | "accepted" | "rejected"
  applied_at: string
  updated_at: string
}

export interface ApplicationResponse {
  id: string
  application_id: string
  field_id: string
  value: string
  created_at: string
}

// Fetch applications for a job
export function useJobApplications(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      if (!jobId) return []
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false })

      if (error) throw error
      return data as Application[]
    },
    enabled: !!jobId,
  })
}

// Fetch applications for a job seeker
export function useJobSeekerApplications(applicantId: string | undefined) {
  return useQuery({
    queryKey: ["job-seeker-applications", applicantId],
    queryFn: async () => {
      if (!applicantId) return []
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("applicant_id", applicantId)
        .order("applied_at", { ascending: false })

      if (error) throw error
      return data as Application[]
    },
    enabled: !!applicantId,
  })
}

// Fetch a single application with responses
export function useApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      if (!applicationId) return null
      const { data, error } = await supabase
        .from("applications")
        .select("*, application_responses(*)")
        .eq("id", applicationId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!applicationId,
  })
}

// Create a new application
export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appData: Omit<Application, "id" | "applied_at" | "updated_at">) => {
      const { data, error } = await supabase.from("applications").insert([appData]).select().single()

      if (error) throw error
      return data as Application
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", newApp.job_id] })
      queryClient.invalidateQueries({ queryKey: ["job-seeker-applications", newApp.applicant_id] })
    },
  })
}

// Submit application responses
export function useSubmitApplicationResponses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (responses: Omit<ApplicationResponse, "id" | "created_at">[]) => {
      const { data, error } = await supabase.from("application_responses").insert(responses).select()

      if (error) throw error
      return data as ApplicationResponse[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application"] })
    },
  })
}

// Update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from("applications").update({ status }).eq("id", id).select().single()

      if (error) throw error
      return data as Application
    },
    onSuccess: (updatedApp) => {
      queryClient.invalidateQueries({ queryKey: ["application", updatedApp.id] })
      queryClient.invalidateQueries({ queryKey: ["job-applications"] })
    },
  })
}
