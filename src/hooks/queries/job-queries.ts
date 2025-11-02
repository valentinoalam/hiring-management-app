import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { Job, JobFilters, JobListResponse, UpdateJobData } from '@/types/job';
import { JobFormData } from '@/components/job/recruiter/JobOpeningModal';
import { apiFetch } from '@/lib/api';

// API functions for Jobs
// const fetchAllJobs = async (filters?: JobFilters): Promise<JobListResponse> => {
//   const params = new URLSearchParams();
//   if (filters?.status) filters.status.forEach(s => params.append('status', s));
//   if (filters?.employmentType) filters.employmentType.forEach(t => params.append('employmentType', t));
//   if (filters?.department) filters.department.forEach(d => params.append('department', d));
//   if (filters?.location) filters.location.forEach(l => params.append('location', l));
//   if (filters?.companyId) filters.companyId.forEach(c => params.append('companyId', c));
//   if (filters?.search) params.append('search', filters.search);
//   return apiFetch(`/api/jobs?${params.toString()}`);
// };

const fetchAllJobs = async (filters?: Omit<JobFilters, 'companyId'> & { page?: number }): Promise<JobListResponse> => {
  const params = new URLSearchParams();
  if (filters?.employmentType) filters.employmentType.forEach(t => params.append('employmentType', t));
  if (filters?.department) filters.department.forEach(d => params.append('department', d));
  if (filters?.location) filters.location.forEach(l => params.append('location', l));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());

  return apiFetch(`/api/jobs/public?${params.toString()}`);
};

const fetchJobDetail = async (jobId: string): Promise<Job> => {
  return apiFetch(`/api/jobs/${jobId}`);
};

const fetchRecruiterJobs = async (filters?: { status?: string; search?: string; page?: number }): Promise<JobListResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());

  return apiFetch(`/api/jobs/recruiter?${params.toString()}`);
};


const fetchActiveJobs = async (): Promise<Job[]> => {
  return apiFetch('/api/jobs?isActive=true');
};

const createJob = async (newJob: JobFormData): Promise<Job> => {
  return apiFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(newJob),
  });
};

const updateJob = async ({ id, data }: { id: string; data: UpdateJobData }): Promise<Job> => {
  return apiFetch(`/api/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

const deleteJob = async (jobId: string): Promise<string> => {
  await apiFetch(`/api/jobs/${jobId}`, {
    method: 'DELETE',
  });
  return jobId;
};

// React Query hooks for Jobs
export const useAllJobs = () => {
  return useQuery<Job[], Error>({
    queryKey: queryKeys.jobs.all,
    queryFn: async () => {
      const result = await fetchAllJobs();
      return result.jobs;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const usePublicJobs = (filters?: Omit<JobFilters, 'companyId'>) => {
  return useInfiniteQuery<JobListResponse, Error>({
    queryKey: queryKeys.jobs.list(JSON.stringify(filters || {})),
    queryFn: ({ pageParam = 1 }) => fetchAllJobs({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) => 
      firstPage.pagination.hasPrevPage ? firstPage.pagination.page - 1 : undefined,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useJobDetail = (jobId: string) => {
  return useQuery<Job, Error>({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => fetchJobDetail(jobId),
    enabled: !!jobId,
  });
};

export const useRecruiterJobs = (filters?: { status?: string; search?: string }) => {
  return useQuery<JobListResponse, Error>({
    queryKey: queryKeys.jobs.recruiter(filters),
    queryFn: () => fetchRecruiterJobs(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes for recruiter jobs
  });
};


export const useActiveJobs = () => {
  return useQuery<Job[], Error>({
    queryKey: queryKeys.jobs.active,
    queryFn: fetchActiveJobs,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation<Job, Error, JobFormData>({
    mutationFn: createJob,
    onSuccess: (newJob) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.recruiter() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.public() });
      
      // Add the new job to recruiter jobs cache
      queryClient.setQueryData(
        queryKeys.jobs.recruiter(),
        (old: JobListResponse | undefined) => {
          if (!old) return { jobs: [newJob], pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 } };
          return {
            ...old,
            jobs: [newJob, ...old.jobs],
            pagination: { ...old.pagination, totalCount: old.pagination.totalCount + 1 }
          };
        }
      );
      
      toast.success('Job created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation<Job, Error, { id: string; data: UpdateJobData }>({
    mutationFn: updateJob,
    onSuccess: (updatedJob) => {
      // Update job detail cache
      queryClient.setQueryData(queryKeys.jobs.detail(updatedJob.id), updatedJob);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.recruiter() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list('') });
      
      toast.success('Job updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update job: ${error.message}`);
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: deleteJob,
    onSuccess: (jobId) => {
      // Remove from all caches
      queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.recruiter() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.public() });
      
      toast.success('Job deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });
};

// Job analytics hook
const fetchJobAnalytics = async (jobId: string) => {
  return apiFetch(`/api/jobs/${jobId}/analytics`);
};

export const useJobAnalytics = (jobId: string) => {
  return useQuery({
    queryKey: queryKeys.jobs.analytics(jobId),
    queryFn: () => fetchJobAnalytics(jobId),
    enabled: !!jobId,
    staleTime: 1000 * 60 * 2, // 2 minutes for analytics
  });
};