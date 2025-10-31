/**
 * TanStack Query Hooks for managing Jobs and Applicants.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { Applicant, ApplicationStatus, ApplicantData } from '@/types/job';
import { apiFetch } from '@/lib/api';

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

