// tests/unit/applicant-queries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApplicationNotes, useJobApplicants, useUpdateApplicantStatus } from '@/hooks/queries/applicant-queries';
import { createMockApplicant } from '../setup';
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

describe('Applicant Queries', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useJobApplicants', () => {
    it('should fetch applicants for a job with filters', async () => {
      const mockApplicants = [
        createMockApplicant(),
        createMockApplicant({ id: 'applicant-456', fullName: 'Jane Smith' }),
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          applicants: mockApplicants, 
          pagination: { totalCount: 2, page: 1, limit: 10, totalPages: 1 } 
        }),
      });

      const { result } = renderHook(() => useJobApplicants('job-123', { status: 'PENDING', search: 'John' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.applicants).toHaveLength(2);
      expect(result.current.data?.applicants[0].fullName).toBe('John Doe');
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/job-123/applications?status=PENDING&search=John', expect.any(Object));
    });

    it('should handle empty applicants list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ applicants: [], pagination: { totalCount: 0, page: 1, limit: 10, totalPages: 0 } }),
      });

      const { result } = renderHook(() => useJobApplicants('job-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.applicants).toHaveLength(0);
      expect(result.current.data?.pagination.totalCount).toBe(0);
    });
  });

  describe('useUpdateApplicantStatus', () => {
    it('should update applicant status successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUpdateApplicantStatus('job-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        jobId: 'job-123',
        applicantIds: ['applicant-123'],
        status: 'UNDER_REVIEW',
        note: 'Moving to review',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/job-123/applications/applicant-123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'REVIEWED' }),
      });
    });

    it('should handle bulk status update', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUpdateApplicantStatus('job-123'), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        jobId: 'job-123',
        applicantIds: ['applicant-123', 'applicant-456'],
        status: 'REJECTED',
        note: 'Not a good fit',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/job-123/applications/bulk', {
        method: 'PUT',
        body: JSON.stringify({ 
          applicantIds: ['applicant-123', 'applicant-456'], 
          status: 'REJECTED',
          note: 'Not a good fit'
        }),
      });
    });
  });

  describe('useApplicationNotes', () => {
    it('should fetch application notes', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'Strong candidate',
          isInternal: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          author: { fullName: 'Recruiter Name' },
        },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotes,
      });

      const { result } = renderHook(() => useApplicationNotes('application-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].content).toBe('Strong candidate');
      expect(global.fetch).toHaveBeenCalledWith('/api/applications/application-123/notes', expect.any(Object));
    });
  });
});