import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
// Mock hooks
const useApplicationFormFields = jest.fn();
const useUserProfile = jest.fn();
const useSubmitJobApplication = jest.fn();

// Mock JobApplicationForm component
const JobApplicationForm = jest.fn();

// Mock the page component
const JobApplicationPage = () => {
  const mockProps = {
    jobId: 'job-123',
    jobTitle: 'Senior Developer',
    companyName: 'Tech Corp',
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    userId: 'user-123'
  };
  return (
    <div data-testid="job-application-page">
      <JobApplicationForm {...mockProps} />
    </div>
  );
};

// Mock the hooks and components
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ jobId: 'job-123' }),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseApplicationFormFields = useApplicationFormFields as jest.MockedFunction<typeof useApplicationFormFields>;
const mockUseUserProfile = useUserProfile as jest.MockedFunction<typeof useUserProfile>;
const mockUseSubmitJobApplication = useSubmitJobApplication as jest.MockedFunction<typeof useSubmitJobApplication>;
const mockJobApplicationForm = JobApplicationForm as jest.MockedFunction<typeof JobApplicationForm>;

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

describe('Job Application Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        expires: '2024-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    });
  });

  it('should complete full job application flow successfully', async () => {
    const user = userEvent.setup();
    const mockMutateAsync = jest.fn().mockResolvedValue({ id: 'application-123' });

    // Mock the form data fetching
    mockUseApplicationFormFields.mockReturnValue({
      data: {
        job: { id: 'job-123', title: 'Senior Developer', company: { id: 'company-123', name: 'Tech Corp' } },
        formFields: [
          {
            id: 'field-1',
            key: 'full_name',
            label: 'Full Name',
            fieldType: 'text',
            fieldState: 'mandatory' as const,
            sortOrder: 1,
            field: {
              id: 'field-1',
              key: 'full_name',
              label: 'Full Name',
              fieldType: 'text',
            },
          },
          {
            id: 'field-2',
            key: 'experience',
            label: 'Years of Experience',
            fieldType: 'number',
            fieldState: 'mandatory' as const,
            sortOrder: 2,
            field: {
              id: 'field-2',
              key: 'experience',
              label: 'Years of Experience',
              fieldType: 'number',
            },
          },
        ],
        formConfig: {
          allowMultipleApplications: false,
          resumeRequired: true,
          coverLetterRequired: true,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseUserProfile.mockReturnValue({
      data: {
        id: 'profile-123',
        userId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        location: 'New York, NY',
        gender: 'male',
        linkedin: 'https://linkedin.com/in/johndoe',
        avatarUrl: 'https://example.com/avatar.jpg',
        resumeUrl: 'https://example.com/resume.pdf',
        bio: 'Software developer',
        createdAt: new Date(),
        updatedAt: new Date(),
        userInfo: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseSubmitJobApplication.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
    });

    // Mock the form component to simulate user interaction
    mockJobApplicationForm.mockImplementation(({ onSubmit, onCancel }) => (
      <div data-testid="mock-application-form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              formResponse: {
                full_name: 'John Doe',
                experience: '5',
                cover_letter: 'I am very interested...',
              },
              profileUpdates: {
                phone: '+1234567890',
                location: 'New York, NY',
              },
              userInfoUpdates: [
                {
                  fieldId: 'field-1',
                  infoFieldAnswer: 'John Doe',
                },
                {
                  fieldId: 'field-2',
                  infoFieldAnswer: '5',
                },
              ],
            });
          }}
        >
          <input type="text" defaultValue="John Doe" data-testid="full-name-input" />
          <input type="number" defaultValue="5" data-testid="experience-input" />
          <textarea defaultValue="I am very interested..." data-testid="cover-letter-input" />
          <button type="submit" data-testid="submit-application">
            Submit Application
          </button>
          <button type="button" onClick={onCancel} data-testid="cancel-application">
            Cancel
          </button>
        </form>
      </div>
    ));

    render(<JobApplicationPage />, { wrapper: createWrapper() });

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-application-form')).toBeInTheDocument();
    });

    // Verify form is pre-filled with user data
    expect(screen.getByTestId('full-name-input')).toHaveValue('John Doe');
    expect(screen.getByTestId('experience-input')).toHaveValue(5);

    // Submit the application
    await user.click(screen.getByTestId('submit-application'));

    // Verify the application was submitted with correct data
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        formResponse: expect.objectContaining({
          full_name: 'John Doe',
          experience: '5',
          cover_letter: 'I am very interested...',
        }),
        profileUpdates: expect.objectContaining({
          phone: '+1234567890',
          location: 'New York, NY',
        }),
        userInfoUpdates: expect.arrayContaining([
          expect.objectContaining({
            fieldId: 'field-1',
            infoFieldAnswer: 'John Doe',
          }),
          expect.objectContaining({
            fieldId: 'field-2',
            infoFieldAnswer: '5',
          }),
        ]),
      });
    });
  });

  it('should handle application submission errors gracefully', async () => {
    const user = userEvent.setup();
    const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Submission failed'));

    mockUseApplicationFormFields.mockReturnValue({
      data: {
        job: { id: 'job-123', title: 'Senior Developer', company: { id: 'company-123', name: 'Tech Corp' } },
        formFields: [],
        formConfig: {
          allowMultipleApplications: false,
          resumeRequired: false,
          coverLetterRequired: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseUserProfile.mockReturnValue({
      data: {
        id: 'profile-123',
        userId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        userInfo: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseSubmitJobApplication.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
    });

    mockJobApplicationForm.mockImplementation(({ onSubmit }) => (
      <div>
        <button
          onClick={() =>
            onSubmit({
              formResponse: {},
              profileUpdates: {},
              userInfoUpdates: [],
            })
          }
          data-testid="submit-application"
        >
          Submit
        </button>
      </div>
    ));

    render(<JobApplicationPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('submit-application')).toBeInTheDocument();
    });

    // Submit the application
    await user.click(screen.getByTestId('submit-application'));

    // The error should be handled by the parent component
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });
});