import { ApplicantData, ApplicationData, FormField } from "@/types/job"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { apiFetch } from "@/lib/api";
import { Application } from "@prisma/client";
import { Profile } from '@/types/user';

// NEW: API functions for Job Applications and Profile Updates
const submitJobApplication = async ({
  jobId,
  applicationData,
}: {
  jobId: string;
  applicationData: ApplicationData;
}): Promise<{ application: ApplicantData }> => {
  const backendData = {
    formResponse: applicationData.formResponse,
    profileUpdates: applicationData.profileUpdates,
    userInfoUpdates: applicationData.otherInfoUpdates,
  };
  return apiFetch(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify(backendData),
  });
};

const fetchUserProfile = async (userId: string) => {
  return apiFetch(`/api/profiles/user/${userId}`);
};

const updateUserProfile = async ({
  userId,
  profileData,
}: {
  userId: string;
  profileData: Partial<Profile>;
}): Promise<Profile> => {
  return apiFetch(`/api/profiles/user/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

export function useJobFormFields(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job-form-fields", jobId],
    queryFn: async () => {
      if (!jobId) return []
      const response = await fetch(`/api/form-fields?jobId=${jobId}`)
      if (!response.ok) throw new Error("Failed to fetch form fields")
      return response.json() as Promise<FormField[]>
    },
    enabled: !!jobId,
  })
}

export function useCreateFormField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fieldData: Omit<FormField, "id" | "createdAt" | "updatedAt">) => {
      const response = await fetch("/api/form-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldData),
      })
      if (!response.ok) throw new Error("Failed to create form field")
      return response.json() as Promise<FormField>
    },
    onSuccess: (newField) => {
      queryClient.invalidateQueries({ queryKey: ["job-form-fields", newField.jobId] })
    },
  })
}

export function useUpdateFormField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...fieldData }: Partial<FormField> & { id: string }) => {
      const response = await fetch(`/api/form-fields/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldData),
      })
      if (!response.ok) throw new Error("Failed to update form field")
      return response.json() as Promise<FormField>
    },
    onSuccess: (updatedField) => {
      queryClient.invalidateQueries({ queryKey: ["job-form-fields", updatedField.jobId] })
    },
  })
}

export function useDeleteFormField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await fetch(`/api/form-fields/${fieldId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete form field")
      return fieldId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-form-fields"] })
    },
  })
}

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.currentUser.profile(),
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    retry: 1, // Tambahkan 'retry: false' untuk berjaga-jaga jika ada kasus error lain, atau atur retryCount ke 1.
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedProfile, variables) => {
      // Update the profile cache
      queryClient.setQueryData(queryKeys.profile.user(variables.userId), updatedProfile);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });
};

export const useSubmitJobApplication = (jobId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationData: ApplicationData) => submitJobApplication({ jobId, applicationData }),
    onSuccess: (result) => {
      console.log(result)
      // Update profile cache with new data
      queryClient.setQueryData(queryKeys.profile.user(result.application?.applicant.userId), result.application?.applicant);
      
      // Invalidate applicants list for this job
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applicants.byJob(result.application?.jobId) 
      });
      
      // Invalidate job applications count
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.jobs.detail(result.application?.jobId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.jobs.analytics(jobId) 
      });
      
      // Invalidate user's applications list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.currentUser.applications() 
      });
      toast.success('Application submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit application: ${error.message}`);
    },
  });
};


const fetchApplicationFormFields = async (jobId: string) => {
  return apiFetch(`/api/jobs/${jobId}/application-fields`);
};

export const useApplicationFormFields = (jobId: string) => {
  return useQuery({
    queryKey: queryKeys.applicants.formFields(jobId),
    queryFn: () => fetchApplicationFormFields(jobId),
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Combined hook for job application flow
export const useJobApplicationFlow = (jobId: string, userId: string) => {
  const { data: appFormFields, isLoading: loadingFields, error: fieldsError } = useApplicationFormFields(jobId);
  const { data: userProfile, isLoading: loadingProfile, error: profileError } = useUserProfile(userId);
  const submitApplication = useSubmitJobApplication(jobId);

  return {
    appFormFields,
    userProfile,
    isLoading: loadingFields || loadingProfile,
    error: fieldsError || profileError,
    submitApplication: submitApplication.mutateAsync,
    isSubmitting: submitApplication.isPending,
    submitError: submitApplication.error,
  };
};


// Hook for user's applications
const fetchUserApplications = async (): Promise<Application[]> => {
  return apiFetch('/api/applications/my-applications');
};

export const useUserApplications = () => {
  return useQuery<Application[], Error>({
    queryKey: queryKeys.currentUser.applications(),
    queryFn: fetchUserApplications,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};