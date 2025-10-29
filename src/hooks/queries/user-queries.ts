import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@prisma/client';

// --- Type Definitions (Extend from your session types for clarity) ---

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
}

interface ApplicationSummary {
  id: string;
  jobTitle: string;
  companyName: string;
  status: 'SUBMITTED' | 'REVIEW' | 'INTERVIEW' | 'REJECTED' | 'HIRED';
  appliedDate: string;
}

interface RecruiterJobSummary {
    id: string;
    title: string;
    status: 'ACTIVE' | 'DRAFT';
    applicantsCount: number;
}

// --- Mock API Fetchers ---

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  // In a real app: const res = await fetch(`/api/user/${userId}/profile`);
  // return res.json();
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  
  // Mock data based on the User ID and expected structure
  return {
    id: userId,
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    role: userId.endsWith('recruiter') ? 'RECRUITER' as UserRole : 'APPLICANT' as UserRole,
    avatarUrl: `https://i.pravatar.cc/150?u=${userId}`,
    bio: 'Software developer passionate about TanStack Query and performance.',
  };
};

const fetchMyApplications = async (): Promise<ApplicationSummary[]> => {
  // Only queried if the user is an APPLICANT
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    { id: 'app1', jobTitle: 'Senior Frontend Dev', companyName: 'Innovatech', status: 'INTERVIEW', appliedDate: '2025-10-01' },
    { id: 'app2', jobTitle: 'Full-stack Engineer', companyName: 'WebCorp', status: 'REVIEW', appliedDate: '2025-09-15' },
    { id: 'app3', jobTitle: 'UX Designer', companyName: 'DesignHub', status: 'REJECTED', appliedDate: '2025-08-20' },
  ];
};

const fetchRecruiterJobPosts = async (): Promise<RecruiterJobSummary[]> => {
  // Only queried if the user is a RECRUITER
  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    { id: 'jobA', title: 'Data Scientist L3', status: 'ACTIVE', applicantsCount: 45 },
    { id: 'jobB', title: 'Cloud Architect', status: 'DRAFT', applicantsCount: 0 },
    { id: 'jobC', title: 'Backend Lead', status: 'ACTIVE', applicantsCount: 72 },
  ];
};

// --- Conditional Query Hooks ---

/**
 * Hook to fetch the currently authenticated user's profile data.
 * @param userId - The ID of the authenticated user.
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => fetchUserProfile(userId),
    // Ensure this only runs if we have a valid userId
    enabled: !!userId,
  });
}

/**
 * Conditionally fetches data relevant to the user's role:
 * - APPLICANT: Fetches `myApplications`.
 * - RECRUITER: Fetches the list of job posts (`recruiterJobs`).
 * * The opposite query is disabled via the `enabled` option.
 */
export function useUserRoleData() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isReady = status === 'authenticated' && !!userId;

  // 1. Applicant Data Query
  const myApplicationsQuery = useQuery({
    queryKey: queryKeys.currentUser.applications(),
    queryFn: () => fetchMyApplications(),
    // Only fetch if authenticated AND the role is APPLICANT
    enabled: isReady && userRole === 'APPLICANT',
  });

  // 2. Recruiter Data Query (e.g., job posts list)
  const recruiterJobsQuery = useQuery({
    queryKey: queryKeys.jobs.all, // We reuse 'jobs.all' key structure for simplicity here, but use a specific fetcher
    queryFn: () => fetchRecruiterJobPosts(),
    // Only fetch if authenticated AND the role is RECRUITER
    enabled: isReady && userRole === 'RECRUITER',
  });

  return {
    // Basic session data
    userId,
    userRole,
    isReady,
    
    // Applicant Data
    myApplications: myApplicationsQuery.data,
    isLoadingApplications: myApplicationsQuery.isLoading,
    isErrorApplications: myApplicationsQuery.isError,

    // Recruiter Data
    recruiterJobs: recruiterJobsQuery.data,
    isLoadingRecruiterJobs: recruiterJobsQuery.isLoading,
    isErrorRecruiterJobs: recruiterJobsQuery.isError,
  };
}
