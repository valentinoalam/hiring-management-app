// tests/setup.ts
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
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

// Mock fetch
global.fetch = jest.fn();

// --- Global Mocks ---

// Mock next/font
jest.mock('next/font/local', () => ({
  __esModule: true,
  default: () => ({
    className: 'mock-font-class',
    style: { fontFamily: 'mock-font' },
  }),
}));

jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mock-font-class',
    style: { fontFamily: 'mock-font' },
  }),
}));

// Mock next/navigation - Use function mocks that can be overridden in tests
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
  useParams: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next-auth/next
jest.mock('next-auth/next', () => ({
  authForServer: jest.fn(),
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock external libraries
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn(),
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    profile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  },
}));

// Mock email functions
jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendMagicLinkEmail: jest.fn(),
}));

// Mock token functions
jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: jest.fn(),
  generatePasswordResetToken: jest.fn(),
  getVerificationTokenByToken: jest.fn(),
  getVerificationTokenByEmail: jest.fn(),
  deleteVerificationToken: jest.fn(),
}));

// Mock auth actions
jest.mock('@/app/(auth)/login/action', () => ({
  signInCredentials: jest.fn(),
  signInMagicLink: jest.fn(),
  signInOAuth: jest.fn(),
}));

jest.mock('@/app/(auth)/sign-up/action', () => ({
  signUpWithEmail: jest.fn(),
}));

// --- Default Mock Implementations ---

// Note: Default implementations are set within the jest.mock() calls above
// This ensures proper mock setup without requiring additional imports

// --- Test Utilities (Mock Data) ---

export const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'APPLICANT' as const,
    isVerified: true,
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