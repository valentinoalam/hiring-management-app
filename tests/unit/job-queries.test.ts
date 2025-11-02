// tests/unit/job-queries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAllJobs, useJobDetail, useCreateJob, useRecruiterJobs } from '@/hooks/queries/job-queries';
import { createMockJob } from '../setup';
import React from 'react';

// Create a wrapper with QueryClient
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


describe('Job Queries', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useAllJobs', () => {
    it('should fetch all jobs successfully', async () => {
      const mockJobs = [createMockJob(), createMockJob({ id: 'job-456', title: 'Frontend Developer' })];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: mockJobs, pagination: { totalCount: 2, page: 1, limit: 10, totalPages: 1 } }),
      });

      const { result } = renderHook(() => useAllJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].title).toBe('Senior Developer');
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs', expect.any(Object));
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAllJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('useJobDetail', () => {
    it('should fetch job details successfully', async () => {
      const mockJob = createMockJob();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
      });

      const { result } = renderHook(() => useJobDetail('job-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.title).toBe('Senior Developer');
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/job-123', expect.any(Object));
    });

    it('should not fetch when jobId is not provided', async () => {
      const { result } = renderHook(() => useJobDetail(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('useCreateJob', () => {
    it('should create a job successfully', async () => {
      const mockJob = createMockJob();
      const newJobData = {
        title: 'New Job',
        description: 'Job description',
        remotePolicy: 'remote' as const,
        salaryMin: '80000',
        salaryMax: '120000',
        numberOfCandidates: 1,
        applicationFormFields: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
      });

      const { result } = renderHook(() => useCreateJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newJobData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(global.fetch).toHaveBeenCalledWith('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(newJobData),
      });
    });

    it('should handle creation error', async () => {
      const newJobData = {
        title: 'New Job',
        description: 'Job description',
        remotePolicy: 'remote' as const,
        salaryMin: '80000',
        salaryMax: '120000',
        numberOfCandidates: 1,
        applicationFormFields: [],
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Creation failed'));

      const { result } = renderHook(() => useCreateJob(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newJobData);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Creation failed');
    });
  });

  describe('useRecruiterJobs', () => {
    it('should fetch recruiter jobs with filters', async () => {
      const mockJobs = [createMockJob(), createMockJob({ status: 'draft' })];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: mockJobs, pagination: { totalCount: 2, page: 1, limit: 10, totalPages: 1 } }),
      });

      const { result } = renderHook(() => useRecruiterJobs({ status: 'draft', search: 'developer' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.jobs).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/recruiter?status=draft&search=developer', expect.any(Object));
    });
  });
});