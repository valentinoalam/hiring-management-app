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
    isSubmitting, 
    error: flowError
  } = useJobApplicationFlow(jobId, userId || '');

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
  
  if (!job || !appFormFields) {
    const title = !job ? "Job Not Found" : "Error Loading Application Data";
    const message = !job? "The job maybe already been removed." : "There was an issue loading the form data. Please try again later.";
    return (
      <div className="min-h-screen bg-neutral-10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-danger-main">{title}</h2>
          <p className="text-neutral-90">{message}</p>
          <Button onClick={handleCancel} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Handle errors from both hooks
  if (jobError || flowError) {
    // You can customize the message based on the error type
    const errorTitle = jobError ? "Job Not Found" : "Error Loading Application Data";
    const errorMessage = jobError ? 
      "The job you're looking for doesn't exist or is no longer available." :
      "There was an issue loading the form data. Please try again later.";

    return (
      <div className="min-h-screen bg-neutral-10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-danger-main">{errorTitle}</h2>
          <p className="text-neutral-90 mt-2">{errorMessage}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <JobApplicationForm
      job={job}
      appFormFields={appFormFields} // <<-- DATA PASSED AS PROP
      userProfile={userProfile} // <<-- DATA PASSED AS PROP
      onSubmit={submitApplication}
      onCancel={handleCancel} />
  );
}