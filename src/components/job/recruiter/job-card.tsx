import { Button } from '@/components/ui/button.js';
import { Job } from '@/types/job.js';
import { formatDate } from '@/utils/formatters/formatDate.js';
import { salaryDisplay } from '@/utils/formatters/salaryFormatter.js';
import { useRouter } from 'next/navigation';
import React from 'react'


function JobCard({ job }: { job: Job }) {
  const router = useRouter();
  const statusConfig = {
    active: {
      label: "Active",
      textColor: "text-success",
      bgColor: "bg-success-surface",
      borderColor: "border-success-border",
    },
    inactive: {
      label: "Inactive",
      textColor: "text-danger",
      bgColor: "bg-danger-surface",
      borderColor: "border-danger-border",
    },
    draft: {
      label: "Draft",
      textColor: "text-secondary",
      bgColor: "bg-secondary-surface",
      borderColor: "border-secondary-border",
    },
  };

  const status = statusConfig[job.status.toLowerCase() as keyof typeof statusConfig] || statusConfig.draft;
  
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-1 ${status.borderColor} ${status.bgColor}`}
          >
            <span className={`text-sm font-bold leading-6 ${status.textColor}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded border border-neutral-40 px-4 py-1">
            <span className="text-sm leading-6 text-neutral-90">
              started on {formatDate(job.createdAt)}
            </span>
          </div>
          {/* Applicants (Col 9-10) */}
          <div className="text-center leading-tight tracking-loose">
            <span className="text-xl font-bold text-primary">{job.candidatesCount}</span>
            <p className="text-xs text-muted-foreground">Applicants</p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex w-full max-w-[495px] flex-col gap-3">
          <div className="flex flex-col justify-center gap-2">
            <h3 className="text-lg font-bold leading-7 text-neutral-100">
              {job.title}
            </h3>
            <div className="flex items-start gap-1">
              <span className="text-base leading-7 text-neutral-80">
                {salaryDisplay(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            </div>
          </div>
        </div>
      
        <div className="flex flex-col items-end justify-end gap-2.5">
          <div className="flex items-end justify-end gap-3">
            <Button onClick={()=>router.push(`/recruiter/jobs/${job.id}`)} className="flex items-center justify-center gap-1 rounded-xl bg-primary px-4 text-s font-bold leading-5 text-white shadow-sm transition-colors hover:bg-primary/90">
              Manage Job
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobCard