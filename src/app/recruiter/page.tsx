/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Edit, Trash2, Loader2, X,
  MapPin, Calendar,
  Search
} from 'lucide-react';

// 💡 Import TanStack Query hooks
import { useAllJobs, useCreateJob } from '@/hooks/queries/job-queries'; 
import { Job, NewJobData } from '@/types/job';
import { salaryDisplay } from '@/utils/formatters/salaryFormatter';
import JobList from '@/components/recruiter/job-list';
import { JobFormData, JobOpeningModal } from '@/components/recruiter/JobOpeningModal';

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

const JobRow = ({ job, onEdit }: { job: Job, onEdit: (id: string) => void }) => {
  const statusClass = {
    ACTIVE: "bg-green-100 text-green-700 border-green-300",
    DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-300",
    INACTIVE: "bg-red-100 text-red-700 border-red-300",
    ARCHIVED: "bg-gray-100 text-gray-700 border-gray-300",
  }[job.status];

  return (
    <div className="grid grid-cols-12 gap-4 p-4 items-center bg-card hover:bg-secondary/50 transition-colors border-b last:border-b-0">
      
      {/* Title and Status (Col 1-5) */}
      <div className="col-span-5 flex flex-col">
        <Link href={`/recruiter/jobs/${job.id}/applicants`} className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1">
          {job.title}
        </Link>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusClass}`}>
            {job.status}
          </span>
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Location & Salary (Col 6-8) */}
      <div className="col-span-3 text-sm text-muted-foreground hidden md:block">
          <span className="flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 text-blue-500" />{job.location}
          </span>
          <span className="flex items-center mt-1">
            {salaryDisplay(job.salaryMin, job.salaryMax, job.salaryCurrency)}
          </span>
      </div>
      
      {/* Applicants (Col 9-10) */}
      <div className="col-span-2 text-center">
        <span className="text-xl font-bold text-primary">{job.candidatesCount}</span>
        <p className="text-xs text-muted-foreground">Applicants</p>
      </div>

      {/* Actions (Col 11-12) */}
      <div className="col-span-2 flex justify-end space-x-2">
        <button 
          title="Edit Job"
          className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
          onClick={() => onEdit(job.id)}
        >
          <Edit className="w-5 h-5" />
        </button>
        <button 
          title="Delete Job"
          className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
          onClick={() => { /* Implement useMutation for deletion here */ }}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function RecruiterJobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 💡 TanStack Query: Fetch all jobs (Recruiter's jobs)
  // For a production app, we would ideally use a hook like useRecruiterJobs(session.user.id)
  const { 
    data: allJobs, 
  } = useAllJobs(); // Assuming this hook fetches the current user's jobs if they are a recruiter

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
      toast({
        title: "Missing Information",
        description: "Please fill in the job title and location.",
        variant: "destructive",
      });
      return;
    }

    createJob(formData, {
      onSuccess: () => {
        toast({
          title: "Job Created!",
          description: `The job "${formData.title}" has been posted.`,
          variant: "default",
        });
        setShowCreateModal(false);
        
        // The onSuccess in useCreateJob already invalidates the 'jobs' query, triggering an automatic refetch
      },
      onError: (err: Error) => {
        toast({
          title: "Creation Failed",
          description: `Could not post job: ${err.message}`,
          variant: "destructive",
        });
      },
    });
  }, [createJob, toast]);
  
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
    router.push('/login?callbackUrl=/recruiter/jobs');
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
