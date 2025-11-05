// tests/setup/auth-test-utils.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendMagicLinkEmail 
} from '@/lib/email';
import {
  generateVerificationToken,
  generatePasswordResetToken,
  getVerificationTokenByToken,
  getVerificationTokenByEmail,
  deleteVerificationToken,
} from '@/lib/tokens';

// Create a wrapper with QueryClient and SessionProvider
export const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Use gcTime instead of cacheTime for newer versions
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={null}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
  
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

// Mock user data
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  password: "hashed-password",
  role: "USER" as const,
  isVerified: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockSession = {
  user: {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    role: "USER" as const,
    isVerified: true,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockToken = {
  sub: "user-123",
  email: "test@example.com",
  name: "Test User",
  role: "USER",
  isVerified: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
};

export const mockVerificationToken = {
  id: "token-123",
  identifier: "test@example.com",
  token: "mock-verification-token",
  expires: new Date(Date.now() + 3600 * 1000),
};

export const mockPasswordResetToken = {
  id: "token-123",
  email: "test@example.com",
  token: "mock-password-reset-token",
  expires: new Date(Date.now() + 3600 * 1000),
};

export const setupAuthMocks = () => {
  // Default mock implementations
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });
  (prisma.user.findFirstOrThrow as jest.Mock).mockResolvedValue(mockUser);
  (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
  (prisma.profile.create as jest.Mock).mockResolvedValue({ id: "profile-123", userId: mockUser.id });
  
  // Token mocks
  (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
  (prisma.verificationToken.create as jest.Mock).mockResolvedValue(mockVerificationToken);
  (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(mockVerificationToken);
  (prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(mockVerificationToken);
  (prisma.verificationToken.delete as jest.Mock).mockResolvedValue(mockVerificationToken);
  
  (prisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
  (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue(mockPasswordResetToken);

  // Password comparison
  (compare as jest.Mock).mockResolvedValue(true);

  // Email mocks
  (sendVerificationEmail as jest.Mock).mockResolvedValue({ id: "email-123" });
  (sendPasswordResetEmail as jest.Mock).mockResolvedValue({ id: "email-123" });
  (sendMagicLinkEmail as jest.Mock).mockResolvedValue({ id: "email-123" });

  // Token function mocks
  (generateVerificationToken as jest.Mock).mockResolvedValue(mockVerificationToken);
  (generatePasswordResetToken as jest.Mock).mockResolvedValue(mockPasswordResetToken);
  (getVerificationTokenByToken as jest.Mock).mockResolvedValue(mockVerificationToken);
  (getVerificationTokenByEmail as jest.Mock).mockResolvedValue(mockVerificationToken);
  (deleteVerificationToken as jest.Mock).mockResolvedValue(undefined);
};

export const clearAuthMocks = () => {
  // Clear all mocks
  jest.clearAllMocks();
};

// Mock successful auth responses
export const mockAuthResponses = {
  magicLinkSuccess: { success: true },
  credentialsSuccess: { success: true, url: '/dashboard' },
  oauthSuccess: { success: true },
  error: { success: false, error: 'Authentication failed' },
}

// Mock form data
export const mockFormData = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
}

// Utility function to setup router mock
export const setupRouterMock = (overrides = {}) => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    ...overrides,
  });
  
  return { mockPush, mockRefresh };
};

// Utility function to setup search params mock
export const setupSearchParamsMock = (params: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams(params);
  
  (useSearchParams as jest.Mock).mockReturnValue({
    get: jest.fn((key: string) => searchParams.get(key)),
    getAll: jest.fn((key: string) => searchParams.getAll(key)),
    has: jest.fn((key: string) => searchParams.has(key)),
    toString: jest.fn(() => searchParams.toString()),
    entries: jest.fn(() => searchParams.entries()),
    keys: jest.fn(() => searchParams.keys()),
    values: jest.fn(() => searchParams.values()),
    forEach: jest.fn((callback) => searchParams.forEach(callback)),
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';