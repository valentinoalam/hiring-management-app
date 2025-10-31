import { convertDecimalToNumber } from "@/utils/formatters/formatters";
import { JobStatus, Prisma } from "@prisma/client";

export interface JobData {
  id: string;
  recruiterId: string;
  companyId: string; // Added company relation
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  employmentType: string | null;
  status: JobStatus;
  requirements?: object; // JSON type
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    email: string;
    fullName: string | null;
  };
  company?: { // Added company field
    id: string;
    name: string;
    logo?: string | null;
    website?: string | null;
    description?: string | null;
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
      },
    },
    company: { // Added company include
      select: {
        id: true,
        name: true,
        logo: true,
        website: true,
        description: true,
      },
    },
    _count: {
      select: { candidates: true },
    },
  },
});

export type JobWithAuthorAndCount = Prisma.JobGetPayload<typeof jobWithAuthorAndCount>;

export interface Job {
  id: string;
  recruiterId: string;
  companyId: string; // Added companyId
  title: string;
  description: string | null;
  companyName: string | null;
  department: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  employmentType: string | null;
  status: JobStatus;
  requirements?: JSON;
  createdAt: string;
  updatedAt: string;
  recruiter?: {
    email: string;
    fullName: string | null;
  };
  company?: { // Added company info
    id: string;
    name: string;
    logo?: string | null;
    website?: string | null;
    description?: string | null;
  };
  candidatesCount?: number;
}

export const transformJobData = (prismaJob: JobWithAuthorAndCount): Job => {
  return {
    id: prismaJob.id,
    recruiterId: prismaJob.recruiterId,
    companyId: prismaJob.companyId, // Added companyId
    title: prismaJob.title,
    description: prismaJob.description,
    companyName: prismaJob.company?.name || null, // Updated to use company name
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
    company: prismaJob.company ? { // Added company data
      id: prismaJob.company.id,
      name: prismaJob.company.name,
      logo: prismaJob.company.logo,
      website: prismaJob.company.website,
      description: prismaJob.company.description,
    } : undefined,
    candidatesCount: prismaJob._count?.candidates || 0
  };
};

export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'INTERVIEW' | 'REJECTED' | 'HIRED';

export interface ApplicantData {
  id: string;
  jobId: string;
  applicantId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  source?: string;
  appliedAt: string;
  viewedAt?: string;
  statusUpdatedAt?: string;
  job?: { // Added job relation with company
    id: string;
    title: string;
    company?: {
      id: string;
      name: string;
      logo?: string | null;
    };
  };
  profile: {
    id: string;
    user: {
      id: string;
      email: string;
      fullName: string;
    };
    phone?: string;
    location?: string;
    gender: string;
    linkedin: string;
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
  fullName: string;
  email: string;
  appliedAt: string;
  status: ApplicationStatus;
  coverLetter?: string;
  source?: string;
  viewedAt?: string;
  statusUpdatedAt?: string;
  phone?: string;
  location?: string;
  gender: string;
  linkedin: string;
  avatarUrl?: string;
  resumeUrl?: string;
  jobId?: string;
  applicantId?: string;
  job?: { // Added job info with company
    id: string;
    title: string;
    company?: {
      id: string;
      name: string;
      logo?: string | null;
    };
  };
}

export interface FormField {
  id: string;
  jobId: string;
  fieldName: string;
  fieldType: string;
  fieldState: "mandatory" | "optional" | "off";
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileField {
  id: string;
  label: string;
  status: "mandatory" | "optional" | "off";
  fieldType?: string;
  key?: string;
}

export interface JobOpeningFormData {
  jobName: string;
  jobType: string;
  jobDescription: string;
  minSalary: string;
  maxSalary: string;
  profileFields: ProfileField[];
  department?: string;
  location?: string;
  salaryCurrency?: string;
  companyId?: string; // Added company selection
}

export interface NewJobData {
  title: string;
  description: string;
  department: string;
  companyId: string; // Added companyId
  numberOfCandidates: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  employment_type: string;
  status: "draft" | "active" | "inactive";
  requirements?: object;
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  companyId?: string; // Added company update
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  employment_type?: string;
  status?: "draft" | "active" | "inactive";
  requirements?: object;
}

export interface ApplicationData {
  jobId: string;
  resumeUrl: string;
  coverLetter: string;
  source?: string;
  applicantInfo?: Record<string, unknown>;
}

// New interfaces for company relations
export interface Company {
  id: string;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  size?: string | null;
  foundedYear?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyWithJobs extends Company {
  _count?: {
    jobs: number;
  };
  jobs?: Job[];
}

export interface JobFilters {
  status?: JobStatus[];
  employmentType?: string[];
  department?: string[];
  location?: string[];
  companyId?: string[]; // Added company filter
  search?: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApplicantListResponse {
  applicants: Applicant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Utility types for API responses
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type JobResponse = ApiResponse<Job>;
export type JobListApiResponse = ApiResponse<JobListResponse>;
export type ApplicantListApiResponse = ApiResponse<ApplicantListResponse>;
export type CompanyResponse = ApiResponse<Company>;
export type CompanyListResponse = ApiResponse<CompanyWithJobs[]>;