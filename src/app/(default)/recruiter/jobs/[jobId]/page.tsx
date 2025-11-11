// page.tsx
"use client"
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ApplicantsTable from "@/components/job/recruiter/applicants-table";
import { Button } from "@/components/ui/button";
import { useJobDetail } from "@/hooks/queries/job-queries";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useJobApplicants, useBulkActionApplicants, useUpdateApplicantStatus } from '@/hooks/queries/applicant-queries';
import { useApplicationFormFields } from '@/hooks/queries/application-queries';
import { ApplicationStatus, Applicant } from '@/types/job';
import { mockApplicants, mockVisibleFields, mockTotalApplicants } from './mock-applicants';
import NoApplicantsHero from '@/components/job/recruiter/no-applicant';

export default function JobApplicantsPage() {
  const params = useParams<{ jobId: string }>()
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [useMock, setUseMock] = useState<boolean>(false)
  // All data fetching happens in the page component
  const { data: job, isLoading: isLoadingJob, isError: isJobError, error: jobError } = useJobDetail(params.jobId);

  const { 
    data: applicantsResponse, 
    isLoading: isLoadingApplicants, 
    isError: isApplicantsError,
    error: applicantsError 
  } = useJobApplicants(params.jobId);

  const { 
    data: applicationFormFields = [], 
    isLoading: isLoadingFormFields,
    isError: isFormFieldsError 
  } = useApplicationFormFields(params.jobId);

  // Mutations
  const updateStatusMutation = useUpdateApplicantStatus(params.jobId);
  const bulkActionMutation = useBulkActionApplicants();

  // Memoized data transformations
  const applicants = useMemo(() => applicantsResponse?.applicants || [], [applicantsResponse]);
    console.log(applicants)
  const visibleFields = useMemo(() => {
    return applicationFormFields
      .filter((field: { fieldState: string }) => field.fieldState !== 'off')
      .sort((a: { sortOrder?: number }, b: { sortOrder?: number }) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [applicationFormFields]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    setSelectedApplicants(prev =>
      prev.length === applicants.length ? [] : applicants.map(applicant => applicant.id)
    );
  }, [applicants]);

  const toggleApplicantSelection = useCallback((applicantId: string) => {
    setSelectedApplicants(prev =>
      prev.includes(applicantId)
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  }, []);

  // Action handlers
  const handleStatusChange = useCallback((newStatus: ApplicationStatus) => {
    updateStatusMutation.mutate({
      jobId: params.jobId,
      applicantIds: selectedApplicants,
      status: newStatus,
    }, {
      onSuccess: () => {
        setSelectedApplicants([]);
      }
    });
  }, [params.jobId, selectedApplicants, updateStatusMutation]);

  const handleBulkAction = useCallback((action: string) => {
    bulkActionMutation.mutate({
      applicantIds: selectedApplicants,
      action,
    }, {
      onSuccess: () => {
        setSelectedApplicants([]);
      }
    });
  }, [selectedApplicants, bulkActionMutation]);

  const handleStatusFilterChange = useCallback((status: ApplicationStatus | 'ALL') => {
    setStatusFilter(status);
  }, []);

  // Calculate match rates (could be moved to backend in real app)
  const applicantsWithMatchRates = useMemo(() => {
    return applicants.map(applicant => ({
      ...applicant,
      matchRate: calculateMatchRate(applicant)
    }));
  }, [applicants]);

  const applicantData = applicantsWithMatchRates && applicantsWithMatchRates.length > 1 ?
    applicantsWithMatchRates: mockApplicants;
  // Loading state
  if (isLoadingJob || isLoadingApplicants || isLoadingFormFields) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applicants data...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (isJobError || !job) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-semibold mb-2">
            {jobError?.message || "Job not found"}
          </h2>
          <p className="text-gray-600 mb-4">
            The job you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
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

  if (isApplicantsError || isFormFieldsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-semibold mb-2">Failed to load applicants</h2>
          <p className="text-gray-600 mb-4">
            {applicantsError?.message || 'Unable to load applicant data. Please try again later.'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if(!useMock && applicants && applicants.length <= 1 ) {
    return <NoApplicantsHero onUseMock={()=>setUseMock(!useMock)}/>;

  }
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
        <p className="text-gray-600">Manage applications for this position</p>
      </div>
      <Button variant={'outline'} onClick={()=>setUseMock(!useMock)}
        className="absolute top-5 right-5 flex items-center justify-center text-s font-medium leading-7 transition-colors active:bg-secondary-pressed text-neutral-80 rounded-lg"
      >
        Back to Real Data
      </Button>
      <ApplicantsTable 
        applicants={applicantData}
        visibleFields={visibleFields || mockVisibleFields}
        selectedApplicants={selectedApplicants}
        statusFilter={statusFilter}
        onSelectAll={toggleSelectAll}
        onSelectApplicant={toggleApplicantSelection}
        onStatusChange={handleStatusChange}
        onBulkAction={handleBulkAction}
        onStatusFilterChange={handleStatusFilterChange}
        isUpdatingStatus={updateStatusMutation.isPending}
        isPerformingBulkAction={bulkActionMutation.isPending}
        jobTitle={job.title}
        totalApplicants={applicantsResponse?.pagination?.totalCount || applicants.length || mockTotalApplicants}
      />
    </div>
  );
}

// Utility function (could be moved to utils)
function calculateMatchRate(applicant: Applicant): number {
  // Add proper null checking and fallbacks
  const applicantId = applicant.id || applicant.applicantId || 'unknown';
  
  const hash = applicantId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const baseRate = 70 + (Math.abs(hash) % 30);
  return Math.round(baseRate);
}