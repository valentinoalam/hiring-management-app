export interface Profile {
  fullname: string;
  id: string;
  userId: string;
  gender?: string;
  email?: string;
  dateOfBirth?: Date;
  bio?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  companyName?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  // otherInfo is array of structured answers
  otherInfo?: ProfileOtherInfo[];
}

// Actual structured info from database
export interface ProfileOtherInfo {
  id: string;
  fieldId: string;
  infoFieldAnswer: string;
  field?: {
    id: string;
    key: string;
    label: string;
    fieldType?: string;
  };
}

export interface ProfileData {
  fullname: string;
  id: string;
  userId: string;
  gender?: string;
  dateOfBirth?: Date;
  email: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  companyName?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  // otherInfo is array of structured answers
  otherInfo?: OtherInfo[];
}
// Dynamic mapped data (for derived frontend usage, optional)
export interface OtherInfo {
  [fieldKey: string]: {
    [fieldLabel: string]: string; // e.g. "Education": "text"
    answer: string;
  };
}

export interface OtherInfoData {
  id: string;
  fieldId: string;
  infoFieldAnswer: string;
  field: InfoField;
}

export interface InfoField {
  key: string;                // e.g. "years_experience", "skills"
  label?: string | null;
  value?: string | null;      // default value
  displayOrder?: number | null;
  fieldType?: string | null;  // "text", "select", "textarea"
  options?: string | null;    // JSON string for select options
}

/**
 * Transforms array of OtherInfoData into dynamic object of OtherInfo type
 */
export const transformProfileUserInfo = (userInfo: OtherInfoData[]): Record<string, string> => {
  return userInfo.reduce((acc: Record<string, string>, item) => {
    const fieldKey = item.field.key;
    const answer = item.infoFieldAnswer || '';

    if (fieldKey && answer) {
      // Handle DateTime objects for date fields
      if (fieldKey === 'date_of_birth' || item.field.fieldType === 'date') {
        // If it's a DateTime string, convert to ISO string
        if (typeof answer === 'string' && answer.includes('T')) {
          // It's already an ISO string, use as-is
          acc[fieldKey] = answer;
        } else if (typeof answer === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(answer)) {
          // It's YYYY-MM-DD format, convert to ISO
          acc[fieldKey] = new Date(answer + 'T00:00:00.000Z').toISOString();
        } else {
          // Try to parse as Date object
          try {
            const date = new Date(answer);
            if (!isNaN(date.getTime())) {
              acc[fieldKey] = date.toISOString();
            }
          } catch {
            // If parsing fails, use the original value
            acc[fieldKey] = answer;
          }
        }
      } else {
        // For non-date fields, use as-is
        acc[fieldKey] = answer;
      }
    }

    return acc;
  }, {});
};

export interface TransformedApplicationData {
  jobId: string;
  userId: string;
  application: {
    jobId: string;
    applicantId: string;
    status: 'PENDING';
    formResponse: JSON;
    coverLetter: string | null;
    source: string;
    appliedAt: Date;
  };
  profileUpdates: {
    fullname: string;
    gender?: string | null;
    dateOfBirth?: Date | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    avatarUrl?: string | null;
    resumeUrl?: string | null;
    linkedinUrl?: string | null;
    bio?: string | null;
    portfolioUrl?: string | null;
    companyName?: string | null;
    website?: string | null;
    githubUrl?: string | null;
  };
  otherInfoUpdates: Array<{
    id?: string;
    profileId: string;
    fieldId: string;
    infoFieldAnswer: string;
  }>;
  files: {
    avatar: File | null;
    resume: File | null;
    coverLetterFile: File | null;
    dynamic: Record<string, File>;
  };
}