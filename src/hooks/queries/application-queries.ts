"use client"

import { FormField } from "@/types/job"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { apiFetch } from "@/lib/api";
import { Application, Profile } from "@prisma/client";

// NEW: API functions for Job Applications and Profile Updates
const submitJobApplication = async ({
  jobId,
  applicationData,
}: {
  jobId: string;
  applicationData: {
    formResponse: JSON;
    profileUpdates: Partial<Profile>;
    userInfoUpdates: Array<{
      id?: string;
      fieldId: string;
      infoFieldAnswer: string;
    }>;
  };
}): Promise<{ application: Application; profile: Profile }> => {
  return apiFetch(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify(applicationData),
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
    queryKey: queryKeys.profile.user(userId),
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

export const useSubmitJobApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitJobApplication,
    onSuccess: (result, variables) => {
      // Update profile cache with new data
      queryClient.setQueryData(queryKeys.profile.user(result.profile.userId), result.profile);
      
      // Invalidate applicants list for this job
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applicants.byJob(variables.jobId) 
      });
      
      // Invalidate job applications count
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.jobs.detail(variables.jobId) 
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
  const { data: appFormFields, isLoading: loadingFields } = useApplicationFormFields(jobId);
  const { data: userProfile, isLoading: loadingProfile } = useUserProfile(userId);
  const submitApplication = useSubmitJobApplication();

  return {
    appFormFields,
    userProfile,
    isLoading: loadingFields || loadingProfile,
    submitApplication: submitApplication.mutateAsync,
    isSubmitting: submitApplication.isPending,
  };
};