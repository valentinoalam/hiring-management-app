// tests/mocks/job-application-mocks.ts
export const mockUser = {
  id: 'user-123',
  profile: {
    id: 'profile-123',
    fullname: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+628123456789',
    location: 'Jakarta, Indonesia',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    avatarUrl: '/avatar.png',
    resumeUrl: '/resumes/sample.pdf',
    gender: 'male',
    dateOfBirth: '1990-01-01'
  }
};

export const mockJob = {
  jobData: {
    id: 'job-123',
    title: 'Senior Frontend Developer',
    company: {
      id: 'company-123',
      name: 'Tech Corp',
      logo: '/company-logo.png'
    },
    description: 'We are looking for a skilled Frontend Developer...',
    location: 'Jakarta, Indonesia',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE'
  },
  formFields: [
    {
      id: 'field-1',
      key: 'full_name',
      label: 'Full Name',
      fieldType: 'text',
      fieldState: 'mandatory',
      sortOrder: 1
    },
    {
      id: 'field-2',
      key: 'email',
      label: 'Email',
      fieldType: 'email',
      fieldState: 'mandatory',
      sortOrder: 2
    },
    {
      id: 'field-3',
      key: 'phone_number',
      label: 'Phone Number',
      fieldType: 'phone_number',
      fieldState: 'mandatory',
      sortOrder: 3
    },
    {
      id: 'field-4',
      key: 'years_experience',
      label: 'Years of Experience',
      fieldType: 'number',
      fieldState: 'optional',
      sortOrder: 4
    },
    {
      id: 'field-5',
      key: 'portfolio_url',
      label: 'Portfolio URL',
      fieldType: 'url',
      fieldState: 'optional',
      sortOrder: 5
    }
  ]
};

export const mockApplication = {
  id: 'app-123',
  applicantId: 'applicant-123',
  jobId: 'job-123',
  status: 'PENDING',
  appliedAt: new Date().toISOString(),
  applicant: {
    id: 'applicant-123',
    userId: 'user-123',
    fullName: 'John Doe',
    email: 'john.doe@example.com'
  }
};