/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useParams, useRouter } from 'next/navigation';
import JobApplicationForm from '@/components/job/job-seeker/apply-form';
import { useJobDetail } from '@/hooks/queries/job-queries';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useJobApplicationFlow } from '@/hooks/queries/application-queries';
import { useSession } from 'next-auth/react';
import { ApplicationData } from '@/types/job';
import { useEffect } from 'react';

export default function JobApplicationPage() {
  const params = useParams();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  if(!session) {
    router.push('/login');
  }
  const user = session?.user;
  const userId = user?.id;

  // Fetch job details
  const { data: job, isLoading: jobLoading, error: jobError } = useJobDetail(jobId);
  useEffect(() => {
    if (jobError) {
      console.error('Error fetching job details:', jobError);
    }
    console.log(job)
  }, [jobError, job])
  // Use the job application flow hook
  const { 
    appFormFields, 
    userProfile, 
    isLoading: dataLoading, 
    submitApplication, 
    isSubmitting 
  } = useJobApplicationFlow(jobId, userId || '');

  const handleSubmit = async (applicationData: ApplicationData) => {
    try {
      await submitApplication({
        jobId,
        resumeUrl: applicationData.resumeUrl || '',
        coverLetter: applicationData.coverLetter || '',
        source: applicationData.source,
        applicantInfo: applicationData.applicantInfo,
      } as ApplicationData);
      
      // Redirect to success page or show success message
      router.push('/jobs/success');
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Application submission error:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (jobLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-neutral-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-90">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="min-h-screen bg-neutral-10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-danger-main">Job Not Found</h2>
          <p className="text-neutral-90 mt-2">The job you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
          <Button onClick={handleCancel} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-neutral-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-90">Job not found.</p>
          <Button onClick={handleCancel} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <JobApplicationForm
      jobId={jobId}
      jobTitle={job.title}
      companyName={job.company?.name || 'Unknown Company'}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      userId={userId!}
    />
  );
}