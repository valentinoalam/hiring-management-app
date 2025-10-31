/**
 * TanStack Query Hooks for managing Jobs and Applicants.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { Job, UpdateJobData, Applicant, ApplicationStatus, ApplicantData } from '@/types/job';
import { JobFormData } from '@/components/recruiter/JobOpeningModal';

// Helper function for API calls
const apiFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

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

// API functions for Applicants
const fetchJobApplicants = async (jobId: string): Promise<Applicant[]> => {
  const applicantsData = await apiFetch(`/api/jobs/${jobId}/applicants`) as ApplicantData[];
  
  // Transform ApplicantData to flat Applicant structure
  return applicantsData.map(transformApplicantData);
};

const fetchApplicantDetail = async (applicantId: string): Promise<Applicant> => {
  const applicantData = await apiFetch(`/api/applicants/${applicantId}`) as ApplicantData;
  return transformApplicantData(applicantData);
};

const fetchApplicationFormFields = async (jobId: string) => {
  return apiFetch(`/api/jobs/${jobId}/application-fields`);
};

const updateApplicantStatus = async ({
  applicantIds,
  status,
}: {
  applicantIds: string[];
  status: ApplicationStatus;
}): Promise<void> => {
  await apiFetch('/api/applicants/status', {
    method: 'PATCH',
    body: JSON.stringify({ applicantIds, status }),
  });
};

const bulkActionApplicants = async ({
  applicantIds,
  action,
}: {
  applicantIds: string[];
  action: string;
}): Promise<void> => {
  await apiFetch('/api/applicants/bulk-actions', {
    method: 'POST',
    body: JSON.stringify({ applicantIds, action }),
  });
};

// Helper function to transform ApplicantData to flat Applicant structure
const transformApplicantData = (applicantData: ApplicantData): Applicant => {
  return {
    id: applicantData.id,
    fullname: applicantData.profile.user.fullName,
    email: applicantData.profile.user.email,
    appliedAt: applicantData.appliedAt,
    status: applicantData.status,
    coverLetter: applicantData.coverLetter,
    source: applicantData.source,
    viewedAt: applicantData.viewedAt,
    statusUpdatedAt: applicantData.statusUpdatedAt,
    phone: applicantData.profile.phone,
    location: applicantData.profile.location,
    gender: applicantData.profile.gender,
    linkedin: applicantData.profile.linkedin,
    avatarUrl: applicantData.profile.avatarUrl,
    resumeUrl: applicantData.profile.resumeUrl,
  };
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

// React Query hooks for Applicants
export const useJobApplicants = (jobId: string) => {
  return useQuery<Applicant[], Error>({
    queryKey: queryKeys.applicants.byJob(jobId),
    queryFn: () => fetchJobApplicants(jobId),
    enabled: !!jobId,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error: Error) => {
      if (error.message.includes('404')) return false;
      return failureCount < 3;
    },
  });
};

export const useApplicantDetail = (applicantId: string) => {
  return useQuery<Applicant, Error>({
    queryKey: queryKeys.applicants.detail(applicantId),
    queryFn: () => fetchApplicantDetail(applicantId),
    enabled: !!applicantId,
  });
};

export const useApplicationFormFields = (jobId: string) => {
  return useQuery({
    queryKey: queryKeys.applicants.formFields(jobId),
    queryFn: () => fetchApplicationFormFields(jobId),
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateApplicantStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplicantStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicants.all });
      toast.success(`Status updated for ${variables.applicantIds.length} applicant${variables.applicantIds.length > 1 ? 's' : ''}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update applicant status: ${error.message}`);
    },
  });
};

export const useBulkActionApplicants = () => {
  const queryClient = useQueryClient();

  const getActionLabel = (action: string): string => {
    const actionLabels: Record<string, string> = {
      'download-resumes': 'Download Resumes',
      'send-email': 'Send Email',
      'archive': 'Archive',
      'delete': 'Delete',
    };
    return actionLabels[action] || action;
  };

  return useMutation({
    mutationFn: bulkActionApplicants,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicants.all });
      const actionLabel = getActionLabel(variables.action);
      toast.success(`${actionLabel} completed for ${variables.applicantIds.length} applicant${variables.applicantIds.length > 1 ? 's' : ''}`);
    },
    onError: (error: Error, variables) => {
      const actionLabel = getActionLabel(variables.action);
      toast.error(`Failed to ${actionLabel.toLowerCase()}: ${error.message}`);
    },
  });
};

export const useUpdateSingleApplicantStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicantId, status }: { applicantId: string; status: ApplicationStatus }) => {
      await updateApplicantStatus({ applicantIds: [applicantId], status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicants.all });
      toast.success(`Applicant status updated to ${variables.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update applicant status: ${error.message}`);
    },
  });
};

export const useSearchApplicants = (jobId: string, searchTerm: string) => {
  return useQuery<Applicant[], Error>({
    queryKey: queryKeys.applicants.search(jobId, searchTerm),
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return fetchJobApplicants(jobId);
      }
      const applicantsData = await apiFetch(`/api/jobs/${jobId}/applicants/search?q=${encodeURIComponent(searchTerm)}`) as ApplicantData[];
      return applicantsData.map(transformApplicantData);
    },
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
};