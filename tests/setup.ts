// tests/setup.ts
// This file is intended for global test setup and mock definitions.
// It MUST be configured in jest.config.mjs under `setupFilesAfterEnv` 
// and should NOT be treated as a test file itself.

import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
// --- Mocks ---
// Mock next/font
jest.mock('next/font/local', () => ({
  __esModule: true,
  default: () => ({
    className: 'mock-font-class',
  }),
}))
// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mock-font-class',
  }),
}))
// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  // Note: useSearchParams now correctly returns the class instance
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'APPLICANT',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock API fetch
global.fetch = jest.fn();

// --- Test Utilities (Mock Data) ---

export const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'APPLICANT' as const,
  },
  expires: '2025-01-01T00:00:00.000Z',
};

export const createMockJob = (overrides = {}) => ({
  id: 'job-123',
  title: 'Senior Developer',
  description: 'Job description',
  department: 'Engineering',
  location: 'Remote',
  salaryMin: 80000,
  salaryMax: 120000,
  salaryCurrency: 'USD',
  employmentType: 'FULL_TIME',
  status: 'active' as const,
  companyId: 'company-123',
  authorId: 'user-456',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  company: {
    id: 'company-123',
    name: 'Test Company',
    logo: null,
    website: null,
    description: null,
  },
  candidatesCount: 5,
  ...overrides,
});

export const createMockApplicant = (overrides = {}) => ({
  id: 'applicant-123',
  fullName: 'John Doe',
  email: 'john@example.com',
  appliedAt: '2024-01-01T00:00:00.000Z',
  status: 'PENDING' as const,
  phone: '+1234567890',
  location: 'New York, NY',
  gender: 'male',
  linkedin: 'https://linkedin.com/in/johndoe',
  avatarUrl: null,
  resumeUrl: 'https://example.com/resume.pdf',
  jobId: 'job-123',
  ...overrides,
});

export const createMockApplication = (overrides = {}) => ({
  id: 'application-123',
  jobId: 'job-123',
  applicantId: 'applicant-123',
  status: 'PENDING' as const,
  coverLetter: 'I am interested in this position...',
  source: 'website',
  appliedAt: '2024-01-01T00:00:00.000Z',
  viewedAt: null,
  statusUpdatedAt: null,
  formResponse: {},
  ...overrides,
});
