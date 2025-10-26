import { useQuery } from "@tanstack/react-query"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface FormField {
  id: string
  job_id: string
  field_name: string
  field_type: string
  required: boolean
  visible: boolean
  order: number
  created_at: string
}

// Fetch form fields for a job
export function useJobFormFields(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job-form-fields", jobId],
    queryFn: async () => {
      if (!jobId) return []
      const { data, error } = await supabase
        .from("application_form_fields")
        .select("*")
        .eq("job_id", jobId)
        .order("order", { ascending: true })

      if (error) throw error
      return data as FormField[]
    },
    enabled: !!jobId,
  })
}
