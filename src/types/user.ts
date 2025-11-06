export interface Profile {
  fullname: string;
  id: string;
  userId: string;
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
export const transformProfileUserInfo = (userInfo: OtherInfoData[]): OtherInfo => {
  return userInfo.reduce((acc: OtherInfo, item) => {
    const fieldKey = item.field.key;
    const fieldLabel = item.field.label || "Unknown";
    const fieldType = item.field.fieldType || "text";
    const answer = item.infoFieldAnswer;

    if (fieldKey) {
      acc[fieldKey] = {
        [fieldLabel]: fieldType,
        answer,
      };
    }

    return acc;
  }, {});
};
