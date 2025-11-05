// tests/unit/application-flow.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useApplicationFormFields, 
  useSubmitJobApplication, 
  useJobApplicationFlow 
} from '@/hooks/queries/application-queries';
import { ApplicationData, ApplicationStatus } from '@/types/job';
import { AppFormField } from '@prisma/client';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('Job Application Flow', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Application Form Fields', () => {
    it('should fetch mandatory and optional form fields for a job', async () => {
      const mockFormFields = {
        job: { 
          id: 'job-123', 
          title: 'Senior Frontend Developer', 
          company: { 
            id: 'company-123',
            name: 'Tech Innovations Inc.',
            logo: '/logos/tech-inc.png'
          } 
        },
        formFields: [
          {
            id: 'field-1',
            key: 'name',
            label: 'Full Name',
            fieldType: 'text',
            fieldState: 'mandatory' as const,
            placeholder: 'Enter your full name',
            validation: { required: true, minLength: 2 }
          },
          {
            id: 'field-2',
            key: 'email',
            label: 'Email Address',
            fieldType: 'email',
            fieldState: 'mandatory' as const,
            validation: { required: true, pattern: 'email' }
          },
          {
            id: 'field-3',
            key: 'experience',
            label: 'Years of Experience',
            fieldType: 'number',
            fieldState: 'mandatory' as const,
            validation: { required: true, min: 0, max: 50 }
          },
          {
            id: 'field-4',
            key: 'skills',
            label: 'Technical Skills',
            fieldType: 'textarea',
            fieldState: 'optional' as const,
            placeholder: 'List your technical skills...'
          },
          {
            id: 'field-5',
            key: 'resume',
            label: 'Upload Resume',
            fieldType: 'file',
            fieldState: 'mandatory' as const,
            validation: { required: true, fileTypes: ['.pdf', '.doc', '.docx'] }
          }
        ],
        formConfig: {
          allowMultipleApplications: false,
          resumeRequired: true,
          coverLetterRequired: true
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormFields,
      });

      const { result } = renderHook(() => useApplicationFormFields('job-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const { formFields, formConfig } = result.current.data!;
      
      // Verify form structure
      expect(formFields).toHaveLength(5);
      
      // Check mandatory fields
      const mandatoryFields = formFields.filter((field: AppFormField) => field.fieldState === 'mandatory');
      expect(mandatoryFields).toHaveLength(4);
      
      // Check optional fields
      const optionalFields = formFields.filter((field: AppFormField) => field.fieldState === 'optional');
      expect(optionalFields).toHaveLength(1);
      
      // Verify form configuration
      expect(formConfig.resumeRequired).toBe(true);
      expect(formConfig.coverLetterRequired).toBe(true);
      expect(formConfig.allowMultipleApplications).toBe(false);
      
      // Verify field properties
      expect(formFields[0]).toMatchObject({
        key: 'name',
        fieldType: 'text',
        fieldState: 'mandatory',
        validation: { required: true }
      });
    });

    it('should handle inactive job that cannot accept applications', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Job not found or not accepting applications' }),
      });

      const { result } = renderHook(() => useApplicationFormFields('inactive-job-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Job Application Submission', () => {
    const mockApplicationData = {
      coverLetter: 'I am very interested in this Senior Frontend Developer position. I have 5 years of experience with React and TypeScript, and I believe my skills align perfectly with your requirements. I am particularly excited about the opportunity to work on your innovative product suite.',
      source: 'company-website',
      formResponse: {
        name: 'John David Smith',
        email: 'john.smith@example.com',
        experience: '5',
        skills: 'React, TypeScript, Next.js, Node.js, GraphQL, Jest, Cypress',
        resume: 'https://example.com/resumes/john-smith-resume.pdf',
        portfolio: 'https://johnsmith.dev',
        github: 'https://github.com/johnsmith',
        linkedin: 'https://linkedin.com/in/johnsmith',
        currentSalary: '95000',
        expectedSalary: '120000',
        noticePeriod: '30',
        relocation: 'yes',
        visaSponsorship: 'no'
      } as unknown as JSON,
      resumeUrl: 'https://example.com/resumes/john-smith-resume.pdf',
      linkedin: 'https://linkedin.com/in/johnsmith',
      phone: '+1-555-0123',
      location: 'San Francisco, CA',
      jobId: "sdsfs"
    };

    it('should submit a complete job application successfully', async () => {
      const mockApplicationResponse = {
        id: 'application-12345',
        jobId: 'job-123',
        applicantId: 'user-123',
        status: 'PENDING' as ApplicationStatus,
        coverLetter: mockApplicationData.coverLetter,
        source: mockApplicationData.source,
        appliedAt: '2024-01-15T10:30:00.000Z',
        viewedAt: null,
        statusUpdatedAt: null,
        formResponse: mockApplicationData.formResponse,
        job: {
          id: 'job-123',
          title: 'Senior Frontend Developer',
          company: {
            id: 'company-123',
            name: 'Tech Innovations Inc.'
          }
        },
        applicant: {
          user: {
            name: 'John David Smith',
            email: 'john.smith@example.com'
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplicationResponse,
      });

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockApplicationData as unknown as ApplicationData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the API call
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/job-123/applications', {
        method: 'POST',
        body: JSON.stringify(mockApplicationData),
      });

      // Verify response data
      expect(result.current.data).toEqual(mockApplicationResponse);
      expect(result.current.data?.application!.status).toBe('PENDING');
      expect(result.current.data?.application!.formResponse).toEqual(mockApplicationData.formResponse);
    });

    it('should handle missing required fields error', async () => {
      const incompleteApplicationData = {
        formResponses: {
          // Missing name and email (required fields)
          skills: 'React, JavaScript',
        },
        coverLetter: 'Test cover letter',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Missing required fields: name, email' 
        }),
      });

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(incompleteApplicationData as unknown as ApplicationData);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('should handle duplicate application error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'You have already applied to this job' 
        }),
      });

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockApplicationData as unknown as ApplicationData);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('should handle network errors during application submission', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network connection failed'));

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(mockApplicationData as ApplicationData);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Network connection failed');
    });
  });

  describe('Complete Application Flow Integration', () => {
    it('should complete entire application flow: load form -> fill data -> submit', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';

      // Step 1: Mock form fields response
      const mockFormFields = {
        job: { 
          id: jobId, 
          title: 'Full Stack Developer',
          company: { name: 'Startup XYZ' }
        },
        formFields: [
          {
            id: 'field-1',
            key: 'name',
            label: 'Full Name',
            fieldType: 'text',
            fieldState: 'mandatory' as const,
          },
          {
            id: 'field-2',
            key: 'github',
            label: 'GitHub Profile',
            fieldType: 'url',
            fieldState: 'optional' as const,
          }
        ],
        formConfig: {
          allowMultipleApplications: false,
          resumeRequired: false,
          coverLetterRequired: true
        }
      };

      // Step 2: Mock user profile
      const mockProfile = {
        id: 'profile-123',
        userId: userId,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1-555-6789',
        location: 'New York, NY',
        linkedin: 'https://linkedin.com/in/janedoe',
        resumeUrl: 'https://example.com/resumes/jane-doe.pdf'
      };

      // Step 3: Mock application submission
      const mockApplication = {
        id: 'application-67890',
        jobId: jobId,
        status: 'PENDING' as ApplicationStatus,
        appliedAt: '2024-01-15T14:45:00.000Z',
        coverLetter: 'I am excited to apply...',
        formResponse: {
          name: 'Jane Doe',
          github: 'https://github.com/janedoe'
        }
      };

      // Setup sequential API calls
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockFormFields }) // Form fields
        .mockResolvedValueOnce({ ok: true, json: async () => mockProfile })    // User profile
        .mockResolvedValueOnce({ ok: true, json: async () => mockApplication }); // Application

      // Test the complete flow using useJobApplicationFlow
      const { result: flowResult } = renderHook(() => useJobApplicationFlow(jobId, userId), {
        wrapper: createWrapper(),
      });

      // Wait for form fields and profile to load
      await waitFor(() => expect(flowResult.current.isLoading).toBe(false));

      // Verify data is loaded
      expect(flowResult.current.appFormFields).toEqual(mockFormFields);
      expect(flowResult.current.userProfile).toEqual(mockProfile);
      expect(flowResult.current.error).toBeUndefined();

      // Now test submission
      const applicationData = {
        jobId: jobId,
        coverLetter: 'I am excited to apply for the Full Stack Developer position at Startup XYZ. With my 4 years of experience in modern web technologies and my passion for creating scalable applications, I believe I would be a valuable addition to your team.',
        source: 'linkedin',
        formResponses: {
          name: 'Jane Doe',
          github: 'https://github.com/janedoe',
          availability: 'immediate',
          portfolio: 'https://janedoe.dev'
        },
        resumeUrl: 'https://example.com/resumes/jane-doe.pdf',
        linkedin: 'https://linkedin.com/in/janedoe'
      };

      const { result: submitResult } = renderHook(() => useSubmitJobApplication(jobId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await submitResult.current.mutateAsync(applicationData as unknown as ApplicationData);
      });

      // Verify submission was successful
      expect(submitResult.current.isSuccess).toBe(true);
      expect(submitResult.current.data).toEqual(mockApplication);

      // Verify all API calls were made in correct order
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1, 
        '/api/jobs/job-123/application-form', 
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2, 
        '/api/profiles/user/user-123', 
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3, 
        '/api/jobs/job-123/applications', 
        {
          method: 'POST',
          body: JSON.stringify(applicationData),
        }
      );
    });

    it('should handle partial application data with some optional fields missing', async () => {
      const minimalApplicationData = {
        formResponses: {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          experience: '3'
        },
        coverLetter: 'Brief cover letter...',
        source: 'website'
      };

      const mockApplicationResponse = {
        id: 'application-111',
        jobId: 'job-123',
        status: 'PENDING' as ApplicationStatus,
        formResponse: minimalApplicationData.formResponses
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplicationResponse,
      });

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(minimalApplicationData as unknown as ApplicationData);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data!.application?.formResponse).toEqual(minimalApplicationData.formResponses);
    });
  });

  describe('Application Status Updates', () => {
    it('should track application status after submission', async () => {
      const applicationData = {
        formResponses: { name: 'Test User', email: 'test@example.com' },
        coverLetter: 'Test application'
      };

      const mockApplication = {
        id: 'application-999',
        jobId: 'job-123',
        status: 'PENDING' as ApplicationStatus,
        appliedAt: '2024-01-15T16:00:00.000Z'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplication,
      });

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(applicationData as unknown as ApplicationData);
      });

      // Verify the application has correct initial status
      expect(result.current.data!.application.status).toBe('PENDING');
      expect(result.current.data!.application.appliedAt).toBeDefined();
    });
  });
});