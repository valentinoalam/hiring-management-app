/**
 * TanStack Query Hooks for managing Jobs and Applicants.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { Job, UpdateJobData } from '@/types/job';
import { JobFormData } from '@/components/recruiter/JobOpeningModal';
import { apiFetch } from '@/lib/api';

// API functions for Jobs
const fetchAllJobs = async (): Promise<Job[]> => {
  return apiFetch('/api/jobs');
};

const fetchJobDetail = async (jobId: string): Promise<Job> => {
  return apiFetch(`/api/jobs/${jobId}`);
};

const fetchRecruiterJobs = async (): Promise<Job[]> => {
  return apiFetch('/api/recruiter/jobs');
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
    queryFn: fetchAllJobs,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useJobDetail = (jobId: string) => {
  return useQuery<Job, Error>({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => fetchJobDetail(jobId),
    enabled: !!jobId,
  });
};

export const useRecruiterJobs = () => {
  return useQuery<Job[], Error>({
    queryKey: queryKeys.jobs.recruiter,
    queryFn: fetchRecruiterJobs,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.recruiter });
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
      queryClient.setQueryData(queryKeys.jobs.detail(updatedJob.id), updatedJob);
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.recruiter });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.recruiter });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.active });
      queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      toast.success('Job deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });
};
