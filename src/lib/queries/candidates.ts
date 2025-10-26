"use client"

import { useQuery } from "@tanstack/react-query"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  gender: string
  linkedin: string
  domicile: string
  applied_date: string
  status: string
}

// Fetch candidates for a job with pagination
export function useJobCandidates(jobId: string | undefined, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ["job-candidates", jobId, page, pageSize],
    queryFn: async () => {
      if (!jobId) return { candidates: [], total: 0 }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from("applications")
        .select(
          `
          id,
          job_seeker_profiles(full_name, phone, location),
          profiles(email),
          application_responses(value, application_form_fields(field_name)),
          status,
          applied_at
        `,
          { count: "exact" },
        )
        .eq("job_id", jobId)
        .range(from, to)
        .order("applied_at", { ascending: false })

      if (error) throw error

      const candidates = (data || []).map((app: any) => ({
        id: app.id,
        name: app.job_seeker_profiles?.full_name || "N/A",
        email: app.profiles?.email || "N/A",
        phone: app.job_seeker_profiles?.phone || "N/A",
        gender:
          app.application_responses?.find((r: any) => r.application_form_fields?.field_name === "gender")?.value ||
          "N/A",
        linkedin:
          app.application_responses?.find((r: any) => r.application_form_fields?.field_name === "linkedin")?.value ||
          "N/A",
        domicile: app.job_seeker_profiles?.location || "N/A",
        applied_date: new Date(app.applied_at).toLocaleDateString(),
        status: app.status,
      }))

      return { candidates, total: count || 0 }
    },
    enabled: !!jobId,
  })
}
