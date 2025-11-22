// page.tsx
"use client"
import { useState, useMemo, useCallback } from 'react';
import ApplicantsTable from "@/components/job/recruiter/applicants-table.js";
import { Button } from "@/components/ui/button.js";
import { useJobDetail } from "@/hooks/queries/job-queries.js";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useJobApplicants, useBulkActionApplicants, useUpdateApplicantStatus } from '@/hooks/queries/applicant-queries.js';
import { ApplicationStatus, Applicant } from '@/types/job.js';
import { mockApplicants, mockVisibleFields, mockTotalApplicants } from './mock-applicants.js';
import NoApplicantsHero from '@/components/job/recruiter/no-applicant.js';
import Loading from '@/components/layout/loading.js';
import { useParams } from 'next/navigation';

export default function JobApplicantsPage() {
  const params = useParams<{ jobId: string }>()
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [useMock, setUseMock] = useState<boolean>(false)

  const { 
    data: jobData, 
    isLoading: isLoadingJob, 
    isError: isJobError, 
    error: jobError 
  } = useJobDetail(params.jobId);
  
  const { 
    data: applicantsResponse, 
    isLoading: isLoadingApplicants, 
    isError: isApplicantsError,
    error: applicantsError 
  } = useJobApplicants(params.jobId);

  // Mutations
  const updateStatusMutation = useUpdateApplicantStatus(params.jobId);
  const bulkActionMutation = useBulkActionApplicants();

  // Extract job and form fields from jobData
  const job = jobData?.jobData;
  const applicationFormFields = useMemo(() => jobData?.formFields || [], [jobData?.formFields]);

  // Memoized data transformations
  const applicants = useMemo(() => applicantsResponse?.applicants || [], [applicantsResponse]);

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

  const applicantsData = useMemo(() => {
    if (useMock) {
      return mockApplicants;
    }
    const filteredApplicants = applicantsWithMatchRates.filter(applicant => {
      // Check if applicant has non-empty values for all visible form fields
      return visibleFields.every((field: { id: string }) => {
        const fieldValue = applicant.userInfo?.[field.id];
        return fieldValue !== undefined && fieldValue !== null && fieldValue.answer !== '';
      });
    });
  
    return filteredApplicants && filteredApplicants.length > 0 ? filteredApplicants : [];
  }, [useMock, applicantsWithMatchRates, visibleFields]);

  const fieldsData = useMemo(() => {
    return useMock ? mockVisibleFields : visibleFields;
  }, [useMock, visibleFields]);

  const totalApplicantsCount = useMemo(() => {
    if (useMock) {
      return mockTotalApplicants;
    }
    return applicantsResponse?.pagination?.totalCount || applicants.length || 0;
  }, [useMock, applicantsResponse, applicants.length]);

  // Loading state
  if (isLoadingJob || isLoadingApplicants) {
    return <Loading message='Loading applicants data' />;
  }

  // Error states
  if (isJobError || isApplicantsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-red-600">
          <h2 className="text-xl font-semibold mb-2">
            {isJobError ? "Job not found" : "Failed to load applicants"}
          </h2>
          <p className="text-gray-600 mb-4">
            {isJobError 
              ? jobError?.message || "The job you're looking for doesn't exist or you don't have access."
              : applicantsError?.message || 'Unable to load applicant data. Please try again later.'
            }
          </p>
          {isJobError ? (
            <Link href="/jobs">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }
  console.log(applicantsResponse?.applicants)
  // No applicants state
  if (!useMock && applicantsData.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          variant={'outline'} 
          onClick={() => setUseMock(!useMock)}
          className="absolute top-5 right-5 flex items-center justify-center text-s font-medium leading-7 transition-colors active:bg-secondary-pressed text-neutral-80 rounded-lg"
        >
          Use Mock Data
        </Button>
        <NoApplicantsHero onUseMock={() => setUseMock(!useMock)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {job?.title || 'Job Applicants'}
        </h1>
        <p className="text-gray-600">Manage applications for this position</p>
      </div>
      
      {useMock && (
        <Button 
          variant={'outline'} 
          onClick={() => setUseMock(!useMock)}
          className="absolute top-5 right-5 flex items-center justify-center text-s font-medium leading-7 transition-colors active:bg-secondary-pressed text-neutral-80 rounded-lg"
        >
          Back to Real Data
        </Button>
      )}

      <ApplicantsTable 
        applicants={applicantsData}
        visibleFields={fieldsData}
        selectedApplicants={selectedApplicants}
        statusFilter={statusFilter}
        onSelectAll={toggleSelectAll}
        onSelectApplicant={toggleApplicantSelection}
        onStatusChange={handleStatusChange}
        onBulkAction={handleBulkAction}
        onStatusFilterChange={handleStatusFilterChange}
        isUpdatingStatus={updateStatusMutation.isPending}
        isPerformingBulkAction={bulkActionMutation.isPending}
        jobTitle={job?.title || ''}
        totalApplicants={totalApplicantsCount}
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