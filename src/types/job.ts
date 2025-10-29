import { JobStatus } from "@prisma/client";

export interface Job {
  id: string
  recruiterId: string
  title: string
  description: string | null
  companyName: string; 
  department: string | null
  location: string | null
  salary: number | null
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
    recruiterProfile?: {
      companyName: string | null
      fullName: string | null
    }
  }
  _count?: {
    applications: number
  }
  candidatesCount?: number; 
}

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

export interface NewJobData {
  title: string;
  description: string;
  department: string;
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
