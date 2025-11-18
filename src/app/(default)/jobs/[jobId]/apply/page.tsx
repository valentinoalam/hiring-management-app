/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useParams, useRouter } from 'next/navigation';
import JobApplicationForm from '@/components/job/job-seeker/apply-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useJobApplicationFlow } from '@/hooks/queries/application-queries';

import { useAuthStore } from '@/stores/auth-store';
import Loading from '@/components/layout/loading';
import JobsNotFound from '../not-found';

export default function JobApplicationPage() {
  const params = useParams();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId as string;
  const router = useRouter();
  const { user } = useAuthStore()
  const userId = user?.id;

  // Use the updated job application flow hook
  const { 
    appFormFields, 
    userProfile, 
    job, // Get job from the hook instead of separate query
    isLoading: dataLoading, 
    submitApplication, 
    isSubmitting, 
    error 
  } = useJobApplicationFlow(jobId, userId || '');

  
  const handleCancel = () => {
    router.back();
  };

  if (dataLoading) {
    return <Loading message='Loading application form' />;
  }
  
  if (!job || !appFormFields) {
    // const title = !job ? "Job Not Found" : "Error Loading Application Data";
    // const message = !job ? "The job may have been removed or is no longer available." : "There was an issue loading the form data. Please try again later.";
    return JobsNotFound;
    // (
    //   <div className="min-h-screen bg-neutral-10 flex items-center justify-center">
    //     <div className="text-center">
    //       <h2 className="text-lg font-bold text-danger-main">{title}</h2>
    //       <p className="text-neutral-90">{message}</p>
    //       <Button onClick={handleCancel} className="mt-4">
    //         <ArrowLeft className="w-4 h-4 mr-2" />
    //         Go Back
    //       </Button>
    //     </div>
    //   </div>
    // );
  }

  // Handle errors from the hook
  if (error) {
    const errorTitle = "Error Loading Application Data";
    const errorMessage = "There was an issue loading the form data. Please try again later.";
    if(error.message?.includes('not found') ||
      error.message?.includes('404')) return JobsNotFound
    else return (
      <div className="min-h-screen bg-neutral-10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-danger-main">{errorTitle}</h2>
          <p className="text-neutral-90 mt-2">{error?.message || errorMessage}</p>
          <div className='gap-5'>
            <Button onClick={handleCancel} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant={"secondary"}
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <JobApplicationForm
      job={job} // Use job from the hook
      appFormFields={appFormFields}
      userProfile={userProfile}
      onSubmit={submitApplication}
      onCancel={handleCancel} />
  );
}