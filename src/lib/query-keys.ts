/**
 * Centralized list of all TanStack Query Keys used in the application.
 * This ensures consistency and makes cache invalidation reliable.
 */
export const queryKeys = {
  // Jobs
  jobs: {
    all: ['jobs'] as const,
    lists: () => [...queryKeys.jobs.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.jobs.lists(), { filters }] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    recruiter: ['jobs', 'recruiter'] as const,
    active: ['jobs', 'active'] as const,
    applicantsByJob: (jobId: string) => [...queryKeys.jobs.detail(jobId), 'applicants'] as const,
  },
  
  // Applicants
  applicants: {
    all: ['applicants'] as const,
    lists: () => [...queryKeys.applicants.all, 'list'] as const,
    list: (filters?: string) => 
      filters 
        ? [...queryKeys.applicants.lists(), { filters }] as const
        : [...queryKeys.applicants.lists()] as const,
    details: () => [...queryKeys.applicants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.applicants.details(), id] as const,
    formFields: (jobId: string) => ['applicants', 'form-fields', jobId] as const,
    search: (jobId: string, searchTerm: string) => ['applicants', 'search', jobId, searchTerm] as const,
    status: (applicantId: string) => [...queryKeys.applicants.detail(applicantId), 'status'] as const,
    documents: (applicantId: string) => [...queryKeys.applicants.detail(applicantId), 'documents'] as const,
    byJob: (jobId: string) => [...queryKeys.jobs.detail(jobId), 'applicants'] as const,
  },
  
  
  // User and Profile
  user: {
    all: ['user'] as const,
    details: () => [...queryKeys.user.all, 'detail'] as const,
    detail: (userId: string) => [...queryKeys.user.details(), userId] as const,
    // User-specific data scoped to the user
    profile: (userId: string) => [...queryKeys.user.detail(userId), 'profile'] as const,
    applications: (userId: string) => [...queryKeys.user.detail(userId), 'applications'] as const,
    jobs: (userId: string) => [...queryKeys.user.detail(userId), 'jobs'] as const,
    // User preferences/settings
    preferences: (userId: string) => [...queryKeys.user.detail(userId), 'preferences'] as const,
    notifications: (userId: string) => [...queryKeys.user.detail(userId), 'notifications'] as const,
  },
  
  // Current user (convenience methods - assumes you have current user context)
  currentUser: {
    all: ['currentUser'] as const,
    profile: () => [...queryKeys.currentUser.all, 'profile'] as const,
    applications: () => [...queryKeys.currentUser.all, 'applications'] as const,
    jobs: () => [...queryKeys.currentUser.all, 'jobs'] as const,
    preferences: () => [...queryKeys.currentUser.all, 'preferences'] as const,
  },
  
  // Application Form Fields
  applicationForm: {
    all: ['applicationForm'] as const,
    byJob: (jobId: string) => [...queryKeys.jobs.detail(jobId), 'applicationForm'] as const,
    fields: (jobId: string) => [...queryKeys.applicationForm.byJob(jobId), 'fields'] as const,
  },
  
  // Analytics and Reports
  analytics: {
    all: ['analytics'] as const,
    applicantStats: (jobId: string) => [...queryKeys.jobs.detail(jobId), 'stats'] as const,
    pipeline: (jobId: string) => [...queryKeys.jobs.detail(jobId), 'pipeline'] as const,
  },
} as const;