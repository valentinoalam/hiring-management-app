// tests/unit/application-queries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useApplicationFormFields, 
  useSubmitJobApplication, 
  useUserApplications,
  useJobApplicationFlow 
} from '@/hooks/queries/application-queries';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createMockJob } from '../setup';
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

describe('Application Queries', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useApplicationFormFields', () => {
    it('should fetch application form fields for a job', async () => {
      const mockFormFields = {
        job: { id: 'job-123', title: 'Senior Developer', company: { name: 'Test Corp' } },
        formFields: [
          {
            id: 'field-1',
            key: 'name',
            label: 'Full Name',
            fieldType: 'text',
            fieldState: 'mandatory' as const,
          },
        ],
        formConfig: {
          allowMultipleApplications: false,
          resumeRequired: true,
          coverLetterRequired: false,
        },
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormFields,
      });

      const { result } = renderHook(() => useApplicationFormFields('job-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.formFields).toHaveLength(1);
      expect(result.current.data?.formFields[0].key).toBe('name');
      expect(result.current.data?.formConfig.resumeRequired).toBe(true);
    });

    it('should handle 404 for non-existent job', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Job not found' }),
      });

      const { result } = renderHook(() => useApplicationFormFields('non-existent-job'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useSubmitJobApplication', () => {
    it('should submit job application successfully', async () => {
      const mockApplication = {
        id: 'application-123',
        jobId: 'job-123',
        status: 'PENDING' as const,
        appliedAt: '2024-01-01T00:00:00.000Z',
      };

      const applicationData = {
        coverLetter: 'I am very interested...',
        source: 'website',
        formResponses: {
          name: 'John Doe',
          experience: '5 years',
        },
        resumeUrl: 'https://example.com/resume.pdf',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplication,
      });

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      (result.current.mutate as (data: unknown) => void)(applicationData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/job-123/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData),
      });
    });

    it('should handle validation errors', async () => {
      const applicationData = {
        formResponses: { name: '' }, // Missing required field
        coverLetter: 'Test',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Missing required field: name' }),
      });

      const { result } = renderHook(() => useSubmitJobApplication('job-123'), {
        wrapper: createWrapper(),
      });

      (result.current.mutate as (data: unknown) => void)(applicationData);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUserApplications', () => {
    it('should fetch user applications', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          jobId: 'job-123',
          status: 'PENDING' as const,
          appliedAt: '2024-01-01T00:00:00.000Z',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          applicantId: 'user-123',
          formResponse: {},
          coverLetter: null,
          viewedAt: null,
          statusUpdatedAt: null,
          source: 'website',
          job: { title: 'Developer', company: { name: 'Tech Corp' } },
        },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplications,
      });

      const { result } = renderHook(() => useUserApplications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect((result.current.data?.[0] as unknown as { job: { title: string } }).job.title).toBe('Developer');
      expect(global.fetch).toHaveBeenCalledWith('/api/applications/my-applications', expect.any(Object));
    });
  });

  describe('useJobApplicationFlow', () => {
    it('should combine form fields and user profile for application flow', async () => {
      const mockFormFields = {
        job: { id: 'job-123', title: 'Developer' },
        formFields: [],
        formConfig: { resumeRequired: true, coverLetterRequired: false },
      };

      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      // Mock form fields fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormFields,
      });

      // Mock profile fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const { result } = renderHook(() => useJobApplicationFlow('job-123', 'user-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.appFormFields).toEqual(mockFormFields);
      expect(result.current.userProfile).toEqual(mockProfile);
      expect(result.current.error).toBeUndefined();
    });
  });
});