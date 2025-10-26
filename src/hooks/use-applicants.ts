import { useQuery } from '@tanstack/react-query'
import { getApplicants } from '@/lib/apiApplicants'

export function useApplicants(jobId: string) {
  return useQuery({
    queryKey: ['applicants', jobId],
    queryFn: () => getApplicants(jobId),
    refetchInterval: 10000, // auto-refresh
    enabled: !!jobId, // only run if jobId exists
  })
}
