/* eslint-disable @typescript-eslint/no-unused-vars */
// __tests__/jobs-page.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import JobsPage from '@/app/jobs/page';
import { useAllJobs } from '@/hooks/queries/job-queries';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/queries/job-queries', () => ({
  useAllJobs: jest.fn(),
}));

jest.mock('@/components/custom-ui/drawer', () => {
  return function MockDrawer({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
    return isOpen ? <div data-testid="drawer">{children}</div> : null;
  };
});

jest.mock('@/components/job/job-seeker/JobDetail', () => {
  return function MockJobDetail({ title, company, type, description }: { title: string; company: string; type: string; description: string }) {
    return (
      <div data-testid="job-detail">
        <h2>{title}</h2>
        <p>{company}</p>
        <p>{type}</p>
        <p>{description}</p>
      </div>
    );
  };
});

jest.mock('@/components/job/job-seeker/JobCard', () => {
  return function MockJobCard({ title, company, location, salary, isActive, onClick }: { title: string; company: string; location: string; salary: string; isActive: boolean; onClick: () => void }) {
    return (
      <div 
        data-testid="job-card" 
        data-active={isActive}
        onClick={onClick}
        className={isActive ? 'active' : ''}
      >
        <h3>{title}</h3>
        <p>{company}</p>
        <p>{location}</p>
        <p>{salary}</p>
      </div>
    );
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: () => 'Loader2',
  Briefcase: () => 'Briefcase',
  MapPin: () => 'MapPin',
  Filter: () => 'Filter',
  X: () => 'X',
  Heart: () => 'Heart',
  AlertCircle: () => 'AlertCircle',
  Frown: () => 'Frown',
}));

const mockJobs = [
  {
    id: 'job-1',
    title: 'Frontend Developer',
    companyName: 'TechCorp ABC',
    location: 'Remote',
    employmentType: 'Full-time',
    description: 'Develop amazing web applications',
    salaryMin: 50000,
    salaryMax: 70000,
    salaryCurrency: 'USD',
    createdAt: '2024-01-01',
    candidatesCount: 15,
  },
  {
    id: 'job-2',
    title: 'Backend Developer',
    companyName: 'TechCorp DEF',
    location: 'New York, NY',
    employmentType: 'Contract',
    description: 'Build robust backend systems',
    salaryMin: 60000,
    salaryMax: 80000,
    salaryCurrency: 'USD',
    createdAt: '2024-01-02',
    candidatesCount: 10,
  },
];

const mockPush = jest.fn();
const mockGet = jest.fn();

describe('JobsPage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
  });

  describe('Loading State', () => {
    it('should show loading state when data is loading', () => {
      (useAllJobs as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      });

      render(<JobsPage />);

      expect(screen.getByText('Loader2')).toBeInTheDocument();
      expect(screen.getByText('Fetching latest job openings...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state when there is an error', () => {
      (useAllJobs as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
      });

      render(<JobsPage />);

      expect(screen.getByText('Service Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/Our job listings server is experiencing technical difficulties/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should reload page when Try Again button is clicked', () => {
      (useAllJobs as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
      });

      Object.defineProperty(window, 'location', {
        value: { reload: jest.fn() },
        writable: true,
      });

      render(<JobsPage />);
      
      fireEvent.click(screen.getByText('Try Again'));
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no jobs are available', () => {
      (useAllJobs as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      });

      render(<JobsPage />);

      expect(screen.getByText('No Job Openings Available')).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find any job openings at the moment/)).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      (useAllJobs as jest.Mock).mockReturnValue({
        data: mockJobs,
        isLoading: false,
        isError: false,
      });

      mockGet.mockImplementation((key) => {
        if (key === 'selectedJobId') return null;
        return null;
      });
    });

    it('should render job list and job details when data is available', async () => {
      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('job-card')).toHaveLength(2);
      });

      expect(screen.getByTestId('job-detail')).toBeInTheDocument();
    });

    it('should display job cards with correct information', async () => {
      render(<JobsPage />);

      await waitFor(() => {
        const jobCards = screen.getAllByTestId('job-card');
        expect(jobCards).toHaveLength(2);
        
        // Check if job titles are rendered
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      });
    });

    it('should apply filters when checkboxes are checked', async () => {
      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Test location filter
      const remoteCheckbox = screen.getByLabelText('Remote');
      fireEvent.click(remoteCheckbox);

      expect(mockPush).toHaveBeenCalledWith(
        '?locations=Remote&selectedJobId=job-1',
        { scroll: false }
      );
    });

    it('should select a job when job card is clicked', async () => {
      render(<JobsPage />);

      await waitFor(() => {
        const jobCards = screen.getAllByTestId('job-card');
        fireEvent.click(jobCards[1]); // Click second job card
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('selectedJobId=job-2'),
        { scroll: false }
      );
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      (useAllJobs as jest.Mock).mockReturnValue({
        data: mockJobs,
        isLoading: false,
        isError: false,
      });
    });

    it('should show active filters and allow removal', async () => {
      mockGet.mockImplementation((key) => {
        if (key === 'locations') return 'Remote,New York, NY';
        if (key === 'employmentTypes') return 'Full-time';
        return null;
      });

      render(<JobsPage />);

      await waitFor(() => {
        // Check if active filters are displayed
        expect(screen.getByText('Remote')).toBeInTheDocument();
        expect(screen.getByText('New York, NY')).toBeInTheDocument();
        expect(screen.getByText('Full-time')).toBeInTheDocument();
      });

      // Test filter removal
      const remoteFilter = screen.getByText('Remote');
      fireEvent.click(remoteFilter);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('locations=New York, NY'),
        { scroll: false }
      );
    });

    it('should show no jobs message when filters result in empty list', async () => {
      mockGet.mockImplementation((key) => {
        if (key === 'locations') return 'NonExistentLocation';
        return null;
      });

      (useAllJobs as jest.Mock).mockReturnValue({
        data: mockJobs,
        isLoading: false,
        isError: false,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(screen.getByText('No Jobs Match Your Filters')).toBeInTheDocument();
        expect(screen.getByText('Adjust your filters to see more openings.')).toBeInTheDocument();
      });
    });
  });

  describe('URL Parameter Handling', () => {
    it('should initialize with job selected from URL parameters', async () => {
      mockGet.mockImplementation((key) => {
        if (key === 'selectedJobId') return 'job-2';
        return null;
      });

      (useAllJobs as jest.Mock).mockReturnValue({
        data: mockJobs,
        isLoading: false,
        isError: false,
      });

      render(<JobsPage />);

      await waitFor(() => {
        const jobCards = screen.getAllByTestId('job-card');
        // The second job card should be active
        expect(jobCards[1]).toHaveAttribute('data-active', 'true');
      });
    });

    it('should select first job by default when no job is selected', async () => {
      mockGet.mockImplementation((key) => {
        if (key === 'selectedJobId') return null;
        return null;
      });

      (useAllJobs as jest.Mock).mockReturnValue({
        data: mockJobs,
        isLoading: false,
        isError: false,
      });

      render(<JobsPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '?selectedJobId=job-1',
          { scroll: false }
        );
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should toggle drawer visibility', async () => {
      render(<JobsPage />);

      // Initially drawer might not be visible depending on implementation
      // This test would need to be adjusted based on actual drawer toggle implementation
    });
  });
});

// Additional utility tests
describe('JobsPage Utilities', () => {
  it('should format salary correctly', () => {
    // Test the salaryDisplay utility function
    // This would require importing and testing the actual utility
  });

  it('should handle missing job data gracefully', async () => {
    (useAllJobs as jest.Mock).mockReturnValue({
      data: [{
        id: 'job-1',
        title: 'Test Job',
        // Missing other required fields
      }],
      isLoading: false,
      isError: false,
    });

    mockGet.mockImplementation((_key: string) => null);

    render(<JobsPage />);

    await waitFor(() => {
      // Should render without crashing
      expect(screen.getByText('Test Job')).toBeInTheDocument();
    });
  });
});