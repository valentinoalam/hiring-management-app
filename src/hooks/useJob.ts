import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJobs, createJob, updateJob } from '@/lib/apiJobs'

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
    refetchInterval: 15000, // poll every 15s for updates
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createJob,
    onSuccess: () => queryClient.invalidateQueries(['jobs']),
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: any) => updateJob(id, payload),
    onSuccess: () => queryClient.invalidateQueries(['jobs']),
  })
}
