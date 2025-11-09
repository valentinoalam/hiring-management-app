/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit, Trash2, Loader2, X,
  MapPin, Calendar,
  Search
} from 'lucide-react';

// 💡 Import TanStack Query hooks
import { useCreateJob, useRecruiterJobs } from '@/hooks/queries/job-queries'; 
import { Job } from '@/types/job';
import { salaryDisplay } from '@/utils/formatters/salaryFormatter';
import JobList from '@/components/job/recruiter/job-list';
import { JobFormData, JobOpeningModal } from '@/components/job/recruiter/JobOpeningModal';
import { toast } from 'sonner';

// --- Helper Components ---

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: React.ElementType, colorClass: string }) => (
  <div className="bg-card p-6 rounded-xl shadow-md border flex items-center justify-between transition-all hover:shadow-lg">
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="text-3xl font-bold text-card-foreground mt-1">{value}</h3>
    </div>
    <Icon className={`w-8 h-8 ${colorClass}`} />
  </div>
);

export default function RecruiterJobsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);
  if(status === "unauthenticated") {
    router.push('/login');
  }
  // 💡 TanStack Query: Fetch all jobs (Recruiter's jobs)
  // For a production app, we would ideally use a hook like useRecruiterJobs(session.user.id)
  const { 
    data, 
  } = useRecruiterJobs(); // Assuming this hook fetches the current user's jobs if they are a recruiter
  const allJobs = data?.jobs;
  // 💡 TanStack Query: Mutation for creating a new job
  const { 
    mutate: createJob, 
    isPending: isCreating 
  } = useCreateJob();

  // --- Data Transformation & Stats ---
  // Apply mock candidate counts and default status for visual purposes
  const jobs: Job[] = useMemo(() => {
    return (allJobs || []).map((job: unknown) => {
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
  
  // --- Role Check and Redirect ---
  const userRole = session?.user?.role;

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session || userRole !== 'RECRUITER') { // Assuming 'RECRUITER' is the role type
    router.push('/login?callbackUrl=/recruiter');
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 text-center text-red-500">
        <X className="h-10 w-10 mb-4" />
        <p className="text-xl font-bold">Access Denied</p>
        <p className="mt-2">You must be logged in as a Recruiter to view this page.</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <JobList jobs={jobs} onCreateJob={() => setShowCreateModal(true) } />
      {/* --- Create Job Modal --- */}
      <JobOpeningModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal } 
        onSubmit={handleCreateJob} />
    </div>
  );
}
