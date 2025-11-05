import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock component
const JobApplicationForm = (props: Record<string, unknown>) => <div data-testid="job-application-form">Job Application Form</div>
JobApplicationForm.displayName = 'JobApplicationForm'

// Mock hooks
const mockUseApplicationFormFields = jest.fn()
const mockUseUserProfile = jest.fn()

// Mock data
const createMockAppFormField = (overrides: Record<string, unknown> = {}) => ({
  id: `field-${Date.now()}`,
  key: 'test_field',
  label: 'Test Field',
  fieldType: 'text',
  fieldState: 'mandatory' as const,
  placeholder: 'Enter test value',
  description: 'Test description',
  options: [],
  validation: {},
  sortOrder: 0,
  field: {
    id: `field-${Date.now()}`,
    key: 'test_field',
    label: 'Test Field',
    fieldType: 'text',
    placeholder: 'Enter test value',
    description: 'Test description',
    options: [],
    validation: {},
  },
  ...overrides,
});

const createMockProfile = (overrides: Record<string, unknown> = {}) => ({
  id: 'profile-123',
  userId: 'user-123',
  email: 'john@example.com',
  phone: '+1234567890',
  location: 'New York, NY',
  avatarUrl: 'https://example.com/avatar.jpg',
  resumeUrl: 'https://example.com/resume.pdf',
  bio: 'Software developer',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockOtherUserInfo = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-info-123',
  profileId: 'profile-123',
  fieldId: 'field-123',
  infoFieldAnswer: 'Test answer',
  ...overrides,
});

const defaultProps = {
  jobId: 'job-123',
  jobTitle: 'Senior Frontend Developer',
  companyName: 'Tech Corp',
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  userId: 'user-123',
};


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


describe('JobApplicationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Loading States', () => {
    it('should show loading state when fetching form data', () => {
      mockUseApplicationFormFields.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading application form...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should show error state when form fields fail to load', () => {
      mockUseApplicationFormFields.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch form fields'),
      });

      mockUseUserProfile.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load application form')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch form fields')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should show error state when profile fails to load', () => {
      mockUseApplicationFormFields.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch profile'),
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load application form')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch profile')).toBeInTheDocument();
    });

    it('should show empty state when no form fields are available', () => {
      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: [],
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('No application form available')).toBeInTheDocument();
      expect(screen.getByText('This job is not currently accepting applications.')).toBeInTheDocument();
    });
  });

  describe('Form Initialization with Data', () => {
    it('should pre-fill form with profile data when fields are loaded', async () => {
      const mockProfile = createMockProfile({
        phone: '+1234567890',
        location: 'New York, NY',
        linkedin: 'https://linkedin.com/in/johndoe',
        name: 'John Doe',
        gender: 'male',
      });

      const mockFormFields = [
        createMockAppFormField({ key: 'phone_number', label: 'Phone Number', fieldType: 'text' }),
        createMockAppFormField({ key: 'domicile', label: 'Location', fieldType: 'text' }),
        createMockAppFormField({ key: 'linkedin_url', label: 'LinkedIn URL', fieldType: 'url' }),
        createMockAppFormField({ key: 'full_name', label: 'Full Name', fieldType: 'text' }),
        createMockAppFormField({ key: 'gender', label: 'Gender', fieldType: 'text' }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Check that form fields are rendered
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/linkedin url/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
      });

      // Verify form is pre-filled with profile data
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('New York, NY')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://linkedin.com/in/johndoe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('male')).toBeInTheDocument();
    });

    it('should pre-fill form with userInfo data when available', async () => {
      const mockUserInfo = [
        createMockOtherUserInfo({ fieldId: 'field-1', infoFieldAnswer: 'User Info Answer' }),
      ];

      const mockProfile = createMockProfile({
        userInfo: mockUserInfo,
      });

      const mockFormFields = [
        createMockAppFormField({ 
          id: 'field-1', 
          field: { id: 'field-1', key: 'custom_field', label: 'Custom Field', fieldType: 'text' },
          key: 'custom_field', 
          label: 'Custom Field', 
          fieldType: 'text' 
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText(/custom field/i)).toBeInTheDocument();
      });

      // Should pre-fill with userInfo data instead of profile data
      expect(screen.getByDisplayValue('User Info Answer')).toBeInTheDocument();
    });

    it('should handle mixed data sources (profile and userInfo)', async () => {
      const mockUserInfo = [
        createMockOtherUserInfo({ fieldId: 'field-1', infoFieldAnswer: 'From UserInfo' }),
      ];

      const mockProfile = createMockProfile({
        phone: '+1234567890', // From profile
        location: 'New York, NY', // From profile
        userInfo: mockUserInfo, // From userInfo
      });

      const mockFormFields = [
        createMockAppFormField({ 
          id: 'field-1', 
          field: { id: 'field-1', key: 'custom_field', label: 'Custom Field', fieldType: 'text' },
          key: 'custom_field', 
          label: 'Custom Field', 
          fieldType: 'text' 
        }),
        createMockAppFormField({ key: 'phone_number', label: 'Phone Number', fieldType: 'text' }),
        createMockAppFormField({ key: 'domicile', label: 'Location', fieldType: 'text' }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        // All fields should be rendered
        expect(screen.getByLabelText(/custom field/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      });

      // Verify correct data sources
      expect(screen.getByDisplayValue('From UserInfo')).toBeInTheDocument(); // From userInfo
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument(); // From profile
      expect(screen.getByDisplayValue('New York, NY')).toBeInTheDocument(); // From profile
    });
  });

  describe('Form Field Rendering', () => {
    it('should render different field types correctly', async () => {
      const mockFormFields = [
        createMockAppFormField({ key: 'text_field', label: 'Text Field', fieldType: 'text' }),
        createMockAppFormField({ key: 'email_field', label: 'Email Field', fieldType: 'email' }),
        createMockAppFormField({ key: 'textarea_field', label: 'Textarea Field', fieldType: 'textarea' }),
        createMockAppFormField({ 
          key: 'select_field', 
          label: 'Select Field', 
          fieldType: 'select',
          options: ['Option 1', 'Option 2', 'Option 3'],
        }),
        createMockAppFormField({ key: 'number_field', label: 'Number Field', fieldType: 'number' }),
        createMockAppFormField({ key: 'file_field', label: 'File Field', fieldType: 'file' }),
        createMockAppFormField({ key: 'date_field', label: 'Date Field', fieldType: 'date' }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Check all field types are rendered
        expect(screen.getByLabelText(/text field/i)).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText(/email field/i)).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText(/textarea field/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/select field/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/number field/i)).toHaveAttribute('type', 'number');
        expect(screen.getByLabelText(/file field/i)).toHaveAttribute('type', 'file');
        expect(screen.getByLabelText(/date field/i)).toHaveAttribute('type', 'date');
      });

      // Check select options
      const selectField = screen.getByLabelText(/select field/i);
      expect(within(selectField).getByText('Select an option')).toBeInTheDocument();
      expect(within(selectField).getByText('Option 1')).toBeInTheDocument();
      expect(within(selectField).getByText('Option 2')).toBeInTheDocument();
      expect(within(selectField).getByText('Option 3')).toBeInTheDocument();
    });

    it('should show required field indicators for mandatory fields', async () => {
      const mockFormFields = [
        createMockAppFormField({ key: 'required_field', label: 'Required Field', fieldState: 'mandatory' }),
        createMockAppFormField({ key: 'optional_field', label: 'Optional Field', fieldState: 'optional' }),
        createMockAppFormField({ key: 'off_field', label: 'Off Field', fieldState: 'off' }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Required field should have asterisk
        expect(screen.getByText('Required Field*')).toBeInTheDocument();
        // Optional field should not have asterisk
        expect(screen.getByText('Optional Field')).toBeInTheDocument();
        // Off field should not be rendered
        expect(screen.queryByText('Off Field')).not.toBeInTheDocument();
      });
    });

    it('should render field descriptions when provided', async () => {
      const mockFormFields = [
        createMockAppFormField({ 
          key: 'described_field', 
          label: 'Described Field', 
          description: 'This is a helpful description' 
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup();
      
      const mockFormFields = [
        createMockAppFormField({ 
          key: 'required_field', 
          label: 'Required Field', 
          fieldState: 'mandatory',
          fieldType: 'text'
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText(/required field/i)).toBeInTheDocument();
      });

      // Clear the field (it might be pre-filled)
      const requiredField = screen.getByLabelText(/required field/i);
      await user.clear(requiredField);

      // Try to submit without filling required field
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/required field is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format for email fields', async () => {
      const user = userEvent.setup();
      
      const mockFormFields = [
        createMockAppFormField({ 
          key: 'email_field', 
          label: 'Email Field', 
          fieldState: 'mandatory',
          fieldType: 'email'
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText(/email field/i)).toBeInTheDocument();
      });

      // Enter invalid email
      const emailField = screen.getByLabelText(/email field/i);
      await user.type(emailField, 'invalid-email');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should enable submit button only when form is valid', async () => {
      const user = userEvent.setup();
      
      const mockFormFields = [
        createMockAppFormField({ 
          key: 'required_field', 
          label: 'Required Field', 
          fieldState: 'mandatory',
          fieldType: 'text'
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<JobApplicationForm {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText(/required field/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      
      // Initially should be disabled if required field is empty
      expect(submitButton).toBeDisabled();

      // Fill required field
      const requiredField = screen.getByLabelText(/required field/i);
      await user.type(requiredField, 'Test value');

      // Should become enabled
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data structure', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      const mockProfile = createMockProfile({
        phone: '+1234567890',
        location: 'New York, NY',
        linkedin: 'https://linkedin.com/in/johndoe',
      });

      const mockUserInfo = [
        createMockOtherUserInfo({ 
          id: 'user-info-1',
          fieldId: 'field-1', 
          infoFieldAnswer: 'Original answer' 
        }),
      ];

      const mockFormFields = [
        createMockAppFormField({ 
          id: 'field-1',
          field: { id: 'field-1', key: 'custom_field', label: 'Custom Field', fieldType: 'text' },
          key: 'custom_field', 
          label: 'Custom Field', 
          fieldState: 'mandatory',
          fieldType: 'text'
        }),
        createMockAppFormField({ 
          key: 'phone_number', 
          label: 'Phone Number', 
          fieldState: 'mandatory',
          fieldType: 'text'
        }),
        createMockAppFormField({ 
          key: 'domicile', 
          label: 'Location', 
          fieldState: 'optional',
          fieldType: 'text'
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: { ...mockProfile, userInfo: mockUserInfo },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(
        <JobApplicationForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit} 
        />, 
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/custom field/i)).toBeInTheDocument();
      });

      // Update some fields
      const customField = screen.getByLabelText(/custom field/i);
      await user.clear(customField);
      await user.type(customField, 'Updated custom answer');

      const phoneField = screen.getByLabelText(/phone number/i);
      await user.clear(phoneField);
      await user.type(phoneField, '+0987654321');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      // Verify onSubmit was called with correct data structure
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          formResponse: expect.objectContaining({
            custom_field: 'Updated custom answer',
            phone_number: '+0987654321',
            domicile: 'New York, NY', // unchanged
          }),
          profileUpdates: expect.objectContaining({
            phone: '+0987654321',
            location: 'New York, NY',
            linkedin: 'https://linkedin.com/in/johndoe',
          }),
          userInfoUpdates: expect.arrayContaining([
            expect.objectContaining({
              id: 'user-info-1', // existing ID for update
              fieldId: 'field-1',
              infoFieldAnswer: 'Updated custom answer',
            }),
            expect.objectContaining({
              fieldId: expect.any(String), // For other fields
              infoFieldAnswer: expect.any(String),
            }),
          ]),
        });
      });
    });

    it('should handle file uploads in form submission', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      // Create a mock file
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });

      const mockFormFields = [
        createMockAppFormField({ 
          key: 'resume', 
          label: 'Upload Resume', 
          fieldState: 'mandatory',
          fieldType: 'file'
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: true, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(
        <JobApplicationForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit} 
        />, 
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/upload resume/i)).toBeInTheDocument();
      });

      // Upload file
      const fileInput = screen.getByLabelText(/upload resume/i);
      await user.upload(fileInput, mockFile);

      // Fill other required fields if any
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      
      // Submit the form
      await user.click(submitButton);

      // Verify file is included in form response
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.formResponse.resume).toBe(mockFile);
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const mockFormFields = [
        createMockAppFormField({ 
          key: 'test_field', 
          label: 'Test Field', 
          fieldState: 'mandatory',
          fieldType: 'text'
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(
        <JobApplicationForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit} 
        />, 
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/test field/i)).toBeInTheDocument();
      });

      // Fill required field
      const testField = screen.getByLabelText(/test field/i);
      await user.type(testField, 'Test value');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: [createMockAppFormField()],
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(
        <JobApplicationForm 
          {...defaultProps} 
          onCancel={mockOnCancel} 
        />, 
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button during submission', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const mockFormFields = [
        createMockAppFormField({ 
          key: 'test_field', 
          label: 'Test Field', 
          fieldState: 'mandatory',
          fieldType: 'text'
        }),
      ];

      mockUseApplicationFormFields.mockReturnValue({
        data: {
          job: { id: 'job-123', title: 'Test Job', company: { id: 'company-123', name: 'Test Corp' } },
          formFields: mockFormFields,
          formConfig: { allowMultipleApplications: false, resumeRequired: false, coverLetterRequired: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      mockUseUserProfile.mockReturnValue({
        data: createMockProfile(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(
        <JobApplicationForm 
          {...defaultProps} 
          onSubmit={mockOnSubmit} 
        />, 
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/test field/i)).toBeInTheDocument();
      });

      // Fill required field and submit
      const testField = screen.getByLabelText(/test field/i);
      await user.type(testField, 'Test value');

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      await user.click(submitButton);

      // Cancel button should be disabled during submission
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });
});