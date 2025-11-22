import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from 'next-auth/react';
import type { Application } from '@/generated/prisma/client';
import { Job, Company } from '@/types/job';
import { Profile } from '@/types/user';
import { apiFetch } from '@/lib/api';

// API functions
const fetchUserProfile = async (userId: string): Promise<Profile> => {
  return apiFetch(`/api/profiles/user/${userId}`);
};

const fetchMyApplications = async (): Promise<Application[]> => {
  return apiFetch('/api/applications/my-applications');
};

const fetchRecruiterJobPosts = async (): Promise<Job[]> => {
  return apiFetch('/api/jobs/recruiter');
};

const fetchCompanies = async (): Promise<Company[]> => {
  return apiFetch('/api/companies');
};

// Update user profile
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

// React Query hooks
export const useUserProfile = (userId: string) => {
  return useQuery<Profile, Error>({
    queryKey: queryKeys.profile.user(userId),
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<Profile, Error, { userId: string; profileData: Partial<Profile> }>({
    mutationFn: updateUserProfile,
    onSuccess: (updatedProfile, variables) => {
      queryClient.setQueryData(queryKeys.profile.user(variables.userId), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
};

export const useCompanies = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: fetchCompanies,
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Conditionally fetches data relevant to the user's role
 */
export function useUserRoleData() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isReady = status === 'authenticated' && !!userId;

  // User profile
  const userProfileQuery = useUserProfile(userId!);

  // Applicant Data Query
  const myApplicationsQuery = useQuery<Application[], Error>({
    queryKey: queryKeys.currentUser.applications(),
    queryFn: fetchMyApplications,
    enabled: isReady && userRole === 'APPLICANT',
  });

  // Recruiter Data Query
  const recruiterJobsQuery = useQuery<Job[], Error>({
    queryKey: queryKeys.jobs.recruiter(),
    queryFn: fetchRecruiterJobPosts,
    enabled: isReady && userRole === 'RECRUITER',
  });

  // Companies for recruiters
  const companiesQuery = useCompanies();

  return {
    // Basic session data
    userId,
    userRole,
    isReady,
    
    // User profile
    userProfile: userProfileQuery.data,
    isLoadingProfile: userProfileQuery.isLoading,
    
    // Applicant Data
    myApplications: myApplicationsQuery.data,
    isLoadingApplications: myApplicationsQuery.isLoading,
    isErrorApplications: myApplicationsQuery.isError,

    // Recruiter Data
    recruiterJobs: recruiterJobsQuery.data,
    isLoadingRecruiterJobs: recruiterJobsQuery.isLoading,
    isErrorRecruiterJobs: recruiterJobsQuery.isError,

    // Companies
    companies: companiesQuery.data,
    isLoadingCompanies: companiesQuery.isLoading,
  };
}