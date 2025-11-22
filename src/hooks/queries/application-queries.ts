import { ApplicantData, FormField } from "@/types/job.js"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from '@/lib/query-keys.js';
import { apiFetch } from "@/lib/api.js";
import { Application } from "@/generated/prisma/client.js";
import { Profile } from '@/types/user.js';
import { useRouter } from "next/navigation.js";
import { useJobDetail } from "./job-queries.js";
import { useToast } from "../use-toast.js";

const submitJobApplication = async ({
  jobId,
  applicationData,
}: {
  jobId: string;
  applicationData: FormData; // Change from ApplicationData to FormData
}): Promise<{ application: ApplicantData }> => {
  // Debug what's being sent
  console.log('Sending FormData with keys:', Array.from(applicationData.keys()));
  
  for (const [key, value] of applicationData.entries()) {
    if (value instanceof File) {
      console.log(`File: ${key} - ${value.name} (${value.size} bytes)`);
    } else {
      console.log(`Field: ${key} - ${value}`);
    }
  }
  return apiFetch(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    body: applicationData, // Send FormData directly, no JSON.stringify
    // Note: Don't set Content-Type header - let browser set multipart/form-data automatically
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
  const toast = useToast();
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
  const router = useRouter();
  const toast = useToast();
  return useMutation({
    mutationFn: (formData: FormData) => submitJobApplication({ jobId, applicationData: formData }),
    onSuccess: (result) => {
      console.log('Application submission result:', result);
      const applicantId = result.application?.applicantId || result.application?.applicant?.id;
      
      if (applicantId) {
        // Redirect to success page with applicantId
        router.push(`/${applicantId}/success`);
      } else {
        console.error('No applicantId found in response');
        router.push('/'); // Fallback
      }
      
      // Safe data access with proper null checks
      const application = result?.application;
      const applicant = application?.applicant;
      const applicantUserId = applicant?.userId;
      const jobId = application?.jobId;

      // Only update profile cache if we have the required data
      if (applicantUserId && applicant) {
        queryClient.setQueryData(
          queryKeys.profile.user(applicantUserId), 
          applicant
        );
      } else {
        console.warn('Missing applicant data in response:', { applicantUserId, applicant });
      }
      
      // Invalidate applicants list for this job (with safety check)
      if (jobId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.applicants.byJob(jobId) 
        });
      }
      
      // Invalidate job applications count (with safety check)
      if (jobId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.jobs.detail(jobId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.jobs.analytics(jobId) 
        });
      }
      
      // Invalidate user's applications list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.currentUser.applications() 
      });
      
      toast.success('Application submitted successfully!');
    },
    onError: (error: Error) => {
      console.error('Application submission error:', error);
      if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.');
      }
      toast.error(`Failed to submit application: ${error.message}`);
    },
  });
};




// Combined hook for job application flow
export const useJobApplicationFlow = (jobId: string, userId: string) => {
  // Use job detail hook which now includes form fields
  const { data: jobData, isLoading: loadingJob, error: jobError } = useJobDetail(jobId);
  const { data: userProfile, isLoading: loadingProfile, error: profileError } = useUserProfile(userId);
  const submitApplication = useSubmitJobApplication(jobId);

  // Extract form fields from job data
  const appFormFields = jobData?.formFields;

  return {
    appFormFields,
    userProfile,
    job: jobData?.jobData, // Return the job data as well for consistency
    isLoading: loadingJob || loadingProfile,
    error: jobError || profileError,
    submitApplication: submitApplication.mutateAsync,
    isSubmitting: submitApplication.isPending,
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