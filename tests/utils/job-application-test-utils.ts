// tests/utils/job-application-test-utils.ts
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactElement } from 'react';

// Create a custom render function that includes providers
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data generators specific to job application
export const generateMockFormFields = (count: number, overrides: Partial<any> = {}) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `field-${index + 1}`,
    key: `field_${index + 1}`,
    label: `Field ${index + 1}`,
    fieldType: 'text',
    fieldState: 'mandatory' as const,
    placeholder: `Enter field ${index + 1}`,
    description: `Description for field ${index + 1}`,
    options: [],
    validation: {},
    sortOrder: index + 1,
    field: {
      id: `field-${index + 1}`,
      key: `field_${index + 1}`,
      label: `Field ${index + 1}`,
      fieldType: 'text',
      placeholder: `Enter field ${index + 1}`,
      description: `Description for field ${index + 1}`,
      options: [],
      validation: {},
    },
    ...overrides,
  }));
};

export const createComplexFormFields = () => [
  {
    id: 'field-1',
    key: 'full_name',
    label: 'Full Name',
    fieldType: 'text',
    fieldState: 'mandatory' as const,
    placeholder: 'Enter your full name',
    validation: { required: true, minLength: 2 },
    sortOrder: 1,
    field: {
      id: 'field-1',
      key: 'full_name',
      label: 'Full Name',
      fieldType: 'text',
      placeholder: 'Enter your full name',
      validation: { required: true, minLength: 2 },
    },
  },
  {
    id: 'field-2',
    key: 'email',
    label: 'Email Address',
    fieldType: 'email',
    fieldState: 'mandatory' as const,
    placeholder: 'your.email@example.com',
    validation: { required: true, pattern: 'email' },
    sortOrder: 2,
    field: {
      id: 'field-2',
      key: 'email',
      label: 'Email Address',
      fieldType: 'email',
      placeholder: 'your.email@example.com',
      validation: { required: true, pattern: 'email' },
    },
  },
  {
    id: 'field-3',
    key: 'experience',
    label: 'Years of Experience',
    fieldType: 'number',
    fieldState: 'mandatory' as const,
    validation: { required: true, min: 0, max: 50 },
    sortOrder: 3,
    field: {
      id: 'field-3',
      key: 'experience',
      label: 'Years of Experience',
      fieldType: 'number',
      validation: { required: true, min: 0, max: 50 },
    },
  },
  {
    id: 'field-4',
    key: 'skills',
    label: 'Technical Skills',
    fieldType: 'textarea',
    fieldState: 'optional' as const,
    placeholder: 'List your technical skills...',
    sortOrder: 4,
    field: {
      id: 'field-4',
      key: 'skills',
      label: 'Technical Skills',
      fieldType: 'textarea',
      placeholder: 'List your technical skills...',
    },
  },
];