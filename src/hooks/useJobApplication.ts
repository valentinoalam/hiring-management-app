import { useMutation } from '@tanstack/react-query'
import { applyToJob } from '@/lib/apiApplications'

export function useJobApplication() {
  return useMutation({
    mutationFn: ({ jobId, formData }: any) => applyToJob(jobId, formData),
  })
}
