import { convertDecimalToNumber } from "@/utils/formatters/formatters";
import { JobStatus, Prisma } from "@prisma/client";

export interface JobData {
  id: string;
  recruiterId: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  employmentType: string | null;
  status: JobStatus;
  requirements?: JSON; // JSON type
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    email: string;
    fullName: string | null;
    profile?: {
      companyName: string | null;
    } | null;
  };
  _count?: {
    candidates: number;
  };
}

export const jobWithAuthorAndCount = Prisma.validator<Prisma.JobDefaultArgs>()({
  include: {
    author: {
      select: {
        id: true,
        email: true,
        fullName: true,
        profile: {
          select: {
            companyName: true,
          },
        },
      },
    },
    _count: {
      select: { candidates: true },
    },
  },
});

export type JobWithAuthorAndCount = Prisma.JobGetPayload<typeof jobWithAuthorAndCount>;

export interface Job {
  id: string
  recruiterId: string
  title: string
  description: string | null
  companyName: string | null
  department: string | null
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string;
  employmentType: string | null
  status: JobStatus
  requirements?: JSON
  createdAt: string
  updatedAt: string
  recruiter?: {
    email: string
    fullName: string | null
  }
  candidatesCount?: number; 
}

export const transformJobData = (prismaJob: JobWithAuthorAndCount): Job => {
  return {
    id: prismaJob.id,
    recruiterId: prismaJob.recruiterId,
    title: prismaJob.title,
    description: prismaJob.description,
    companyName: prismaJob.author!.profile?.companyName || null,
    department: prismaJob.department,
    location: prismaJob.location,
    salaryMin: convertDecimalToNumber(prismaJob.salaryMin),
    salaryMax: convertDecimalToNumber(prismaJob.salaryMax),
    salaryCurrency: prismaJob.salaryCurrency!,
    employmentType: prismaJob.employmentType,
    status: prismaJob.status,
    requirements: prismaJob.requirements as unknown as JSON | undefined,
    createdAt: prismaJob.createdAt.toISOString(),
    updatedAt: prismaJob.updatedAt.toISOString(),
    recruiter: prismaJob.author ? {
      email: prismaJob.author.email,
      fullName: prismaJob.author.fullName,
    } : undefined,
    candidatesCount: prismaJob._count?.candidates || 0
  };
};
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'INTERVIEW' | 'REJECTED' | 'HIRED';

export interface ApplicantData {
  id: string;
  jobId: string;
  jobSeekerId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  source?: string;
  appliedAt: string;
  viewedAt?: string;
  statusUpdatedAt?: string;
  profile: {
    id: string;
    user: {
      id: string;
      email: string;
      fullName: string;
    };
    phone?: string;
    location?: string;
    gender: string
    linkedin: string
    avatarUrl?: string;
    resumeUrl?: string;
    userInfo: {
      id: string;
      fieldId: string;
      infoFieldAnswer: string;
      field: {
        id: string;
        key: string;
        label: string;
        fieldType: string;
      };
    }[];
  };
}

export interface Applicant {
  id: string;
  fullname: string;
  email: string;
  appliedAt: string;
  status: ApplicationStatus;
  coverLetter?: string;
  source?: string;
  viewedAt?: string;
  statusUpdatedAt?: string;
  phone?: string;
  location?: string;
  gender: string
  linkedin: string
  avatarUrl?: string;
  resumeUrl?: string;
};

export interface ProfileField {
  id: string;
  label: string;
  status: "mandatory" | "optional" | "off";
}

interface JobOpeningFormData {
  jobName: string;
  jobType: string;
  jobDescription: string;
  minSalary: string;
  maxSalary: string;
  profileFields: ProfileField[];
}

export interface NewJobData {
  title: string;
  description: string;
  department: string;
  numberOfCandidates: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  employment_type: string;
  status: "draft" | "active" | "inactive";
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  employment_type?: string;
  status?: "draft" | "active" | "inactive";
}
export interface ApplicationData {
  jobId: string;
  resumeUrl: string;
  coverLetter: string;
}
