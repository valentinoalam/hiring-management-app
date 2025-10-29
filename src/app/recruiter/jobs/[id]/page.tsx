import ApplicantsTable from "@/components/recruiter/applicants-table";
import { Button } from "@/components/ui/button";
import { useJobDetail } from "@/hooks/queries/job-queries";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

type JobApplicantsPageProps = {
  params: {
    jobId: string; // This matches your URL structure: app/jobs/[jobId]/...
  };
};
export default function JobApplicantsPage({ params }: JobApplicantsPageProps) {
  const jobId = params.jobId;
  const { data: job, isLoading, isError } = useJobDetail(jobId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-semibold mb-2">Job not found</h2>
          <p className="text-gray-600 mb-4">The job you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
          <Link href="/jobs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>{job.location}</span>
              <span>•</span>
              <span>{job.employmentType}</span>
              <span>•</span>
              <span>{job.candidatesCount || job._count?.applications} applicants</span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mt-2">{job.description}</p>
      </div>

      {/* Applicants Table */}
      <ApplicantsTable jobId={params.jobId} />
    </div>
  );
}