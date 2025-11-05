/**
 * TanStack Query Hooks for managing Jobs and Applicants.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { Applicant, ApplicationStatus, ApplicantListResponse, ApplicantData, ApplicantListData } from '@/types/job';
import { apiFetch } from '@/lib/api';

// API functions for Applicants
const fetchJobApplicants = async (jobId: string, filters?: {
  status?: string;
  search?: string;
  source?: string;
  page?: number;
}): Promise<ApplicantListResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.source) params.append('source', filters.source);
  if (filters?.page) params.append('page', filters.page.toString());

  const applicantsData = await apiFetch(`/api/jobs/${jobId}/applications?${params.toString()}`) as ApplicantListData;
  
  // Transform ApplicantData to flat Applicant structure
  const applicants = applicantsData.applicants.map(translateApplicantData);
  
  return {
    applicants,
    pagination: {
      ...applicantsData.pagination,
      totalCount: applicantsData.pagination.total
    }
  };
};

const fetchApplicantDetail = async (applicantId: string): Promise<Applicant> => {
  const applicantData = await apiFetch(`/api/applicants/${applicantId}`) as ApplicantData;
  return translateApplicantData(applicantData);
};


// const updateApplicantStatus = async ({
//   applicantIds,
//   status,
// }: {
//   applicantIds: string[];
//   status: ApplicationStatus;
// }): Promise<void> => {
//   await apiFetch('/api/applicants/status', {
//     method: 'PATCH',
//     body: JSON.stringify({ applicantIds, status }),
//   });
// };

const updateApplicantStatus = async ({
  jobId,
  applicantIds,
  status,
  note,
}: {
  jobId: string;
  applicantIds: string[];
  status: ApplicationStatus;
  note?: string;
}): Promise<void> => {
  if (applicantIds.length === 1) {
    // Single update
    await apiFetch(`/api/jobs/${jobId}/applications/${applicantIds[0]}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  } else {
    // Bulk update
    await apiFetch(`/api/jobs/${jobId}/applications/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ applicantIds, status, note }),
    });
  }
};

// Application Notes API
const fetchApplicationNotes = async (applicationId: string) => {
  return apiFetch(`/api/applications/${applicationId}/notes`);
};

const createApplicationNote = async ({
  applicationId,
  content,
  isInternal = true,
}: {
  applicationId: string;
  content: string;
  isInternal?: boolean;
}) => {
  return apiFetch(`/api/applications/${applicationId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content, isInternal }),
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

/**
 * Convert ApplicantData to Applicant
 * @param {ApplicantData} data
 * @returns {Applicant}
 */
const translateApplicantData = (data: ApplicantData): Applicant => {
  // Build userInfo object: { fieldKey: { [fieldLabel]: fieldType, answer } }
  const userInfo: Record<string, { [key: string]: string; answer: string }> = {};
  if (Array.isArray(data.applicant?.userInfo)) {
    for (const info of data.applicant.userInfo) {
      const key = info.field?.key ?? "";
      const label = info.field?.label ?? "";
      const type = info.field?.fieldType ?? "";
      const answer = info.infoFieldAnswer ?? "";

      if (key) {
        userInfo[key] = {
          [label]: type,
          answer,
        };
      }
    }
  }

  return {
    // Base application info
    id: data.id,
    applicantId: data.applicantId,
    jobId: data.jobId,
    status: data.status,
    coverLetter: data.coverLetter,
    source: data.source,
    appliedAt: data.appliedAt,
    viewedAt: data.viewedAt,
    statusUpdatedAt: data.statusUpdatedAt,

    // Flattened applicant data
    name: data.applicant?.user?.name ?? "",
    email: data.applicant?.user?.email ?? "",
    phone: data.applicant?.phone ?? "",
    location: data.applicant?.location ?? "",
    gender: data.applicant?.gender ?? "",
    linkedin: data.applicant?.linkedin ?? "",
    avatarUrl: data.applicant?.avatarUrl ?? "",
    resumeUrl: data.applicant?.resumeUrl ?? "",

    // Job and company info
    job: data.job
      ? {
          id: data.job.id,
          title: data.job.title,
          company: data.job.company
            ? {
                id: data.job.company.id,
                name: data.job.company.name,
                logo: data.job.company.logo ?? null,
              }
            : undefined,
        }
      : undefined,

    // Custom user info (flattened)
    userInfo: Object.keys(userInfo).length > 0 ? userInfo : undefined,
  };
}

// React Query hooks for Applicants
export const useJobApplicants = (jobId: string, filters?: {
  status?: string;
  search?: string;
  source?: string;
}) => {
  return useQuery<ApplicantListResponse, Error>({
    queryKey: queryKeys.applicants.byJob(jobId, filters),
    queryFn: () => fetchJobApplicants(jobId, filters),
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


export const useUpdateApplicantStatus = (jobId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplicantStatus,
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.applicants.byJob(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.analytics(jobId) });
      
      // Update individual applicant cache if single update
      if (variables.applicantIds.length === 1) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.applicants.detail(variables.applicantIds[0]) 
        });
      }
      
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

export const useUpdateSingleApplicantStatus = (jobId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicantId, status }: { applicantId: string; status: ApplicationStatus }) => {
      await updateApplicantStatus({ jobId, applicantIds: [applicantId], status });
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
        const result = await fetchJobApplicants(jobId);
        return result.applicants;
      }
      const applicantsData = await apiFetch(`/api/jobs/${jobId}/applicants/search?q=${encodeURIComponent(searchTerm)}`) as ApplicantData[];
      return applicantsData.map(translateApplicantData);
    },
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
};


// Application Notes hooks
export const useApplicationNotes = (applicationId: string) => {
  return useQuery({
    queryKey: queryKeys.applicants.notes(applicationId),
    queryFn: () => fetchApplicationNotes(applicationId),
    enabled: !!applicationId,
  });
};

export const useCreateApplicationNote = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplicationNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applicants.notes(applicationId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applicants.detail(applicationId) 
      });
      toast.success('Note added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });
};