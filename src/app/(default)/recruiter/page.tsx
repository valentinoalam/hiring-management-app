/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
// 💡 Import TanStack Query hooks
import { useCreateJob, useRecruiterJobs } from '@/hooks/queries/job-queries'; 
import { Job } from '@/types/job';
import JobList from '@/components/job/recruiter/job-list';
import { JobFormData, JobOpeningModal } from '@/components/job/recruiter/JobOpeningModal';
import { toast } from 'sonner';
import NoJobsHero from '@/components/job/no-job';
import Loading from '@/components/layout/loading';

export default function RecruiterJobsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { 
    data, 
    isLoading: isJobsLoading,
    isError: isJobsError,
    error: jobsError
  } = useRecruiterJobs(); // Assuming this hook fetches the current user's jobs if they are a recruiter
  const allJobs = data?.jobs;
  const { 
    mutate: createJob, 
    isPending: isCreating, 
    isError: createError,
    error: createJobError,
    reset: resetCreateJob
  } = useCreateJob();

  // --- Data Transformation & Stats ---
  const jobs: Job[] = useMemo(() => {
    return (allJobs || []).map((job: Job) => {
      const jobData = job as Job;
      return {
        ...jobData,
        candidatesCount: jobData.candidatesCount || (jobData.id.charCodeAt(0) % 45) + 5, // Deterministic based on job ID
        status: jobData.status || 'ACTIVE' as Job['status'],
        employmentType: jobData.employmentType || 'Full-time' as Job['employmentType'],
      };
    });
  }, [allJobs]);

  const stats = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter(j => j.status === 'ACTIVE').length,
    draft: jobs.filter(j => j.status === 'DRAFT').length,
    inactive: jobs.filter(j => j.status === 'INACTIVE').length,
    totalApplicants: jobs.reduce((sum, j) => sum + (j.candidatesCount || 0), 0),
  }), [jobs]);

  // --- Mutation Handler ---
  const handleCreateJob = useCallback((formData: JobFormData) => {
    if (!formData.title || !formData.location) {
      toast.info('Missing Information', {
        description: 'Please fill in the job title and location.',
      })
      return;
    }

    createJob(formData, {
      onSuccess: () => {
        toast.success("Job Created!", {
          description: `The job "${formData.title}" has been posted.`,
        });
        setShowCreateModal(false);
        
        // The onSuccess in useCreateJob already invalidates the 'jobs' query, triggering an automatic refetch
      },
      onError: (err: Error) => {
        toast.error("Creation Failed",{
          description: `Could not post job: ${err.message}`,
        });
      },
    });
    
  }, [createJob]);

 // Reset mutation state when modal closes
  useEffect(() => {
    if (!showCreateModal && createError) {
      resetCreateJob();
    }
  }, [showCreateModal, resetCreateJob, createError]);
  
  if (isCreating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Creating job...</p>
      </div>
    );
  }


  if (isJobsLoading || !allJobs) {
    return <Loading message='Loading data' />;
  }

  if (!isJobsLoading && allJobs && allJobs.length === 0) {
    return <NoJobsHero onCreateJob={() => setShowCreateModal(true)} />;
  }

  if (isJobsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 text-center text-red-500">
        <X className="h-10 w-10 mb-4" />
        <p className="text-xl font-bold">Error Loading Jobs</p>
        <p className="mt-2">An error occurred while fetching your jobs.</p>
        <p className="mt-2 text-sm text-muted-foreground">{jobsError?.message}</p>
      </div>
    );
  }

  // if(createError) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 text-center text-red-500">
  //       <X className="h-10 w-10 mb-4" />
  //       <p className="text-xl font-bold">Error Creating Job</p>
  //       <p className="mt-2">An error occurred while creating the job.</p>
  //       <p className="mt-2 text-sm text-muted-foreground">{createJobError?.message}</p>
  //     </div>
  //   );
  // }
  return (
    <div className="min-h-[calc(100vh-2rem)] bg-muted/40 p-4 md:p-8">
      <JobList jobs={jobs} onCreateJob={() => setShowCreateModal(true) } />
      {/* --- Create Job Modal --- */}
      <JobOpeningModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal } 
        onSubmit={handleCreateJob} />
    </div>
  );
}
