/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendMagicLinkEmail 
} from '@/lib/email'
import {
  generateVerificationToken,
  generatePasswordResetToken,
  getVerificationTokenByToken,
  getVerificationTokenByEmail,
  deleteVerificationToken,
} from '@/lib/tokens'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}))

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}))

// Create a wrapper with QueryClient
export const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  Wrapper.displayName = 'TestWrapper'
  return Wrapper
}

// Mock user data
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  fullName: "Test User",
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
    fullName: "Test User",
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
  ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });
  ;(prisma.user.findFirstOrThrow as jest.Mock).mockResolvedValue(mockUser);
  ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
  ;(prisma.profile.create as jest.Mock).mockResolvedValue({ id: "profile-123", userId: mockUser.id });
  
  // Token mocks
  ;(prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
  ;(prisma.verificationToken.create as jest.Mock).mockResolvedValue(mockVerificationToken);
  ;(prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue(mockVerificationToken);
  ;(prisma.verificationToken.findFirst as jest.Mock).mockResolvedValue(mockVerificationToken);
  ;(prisma.verificationToken.delete as jest.Mock).mockResolvedValue(mockVerificationToken);
  
  ;(prisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
  ;(prisma.passwordResetToken.create as jest.Mock).mockResolvedValue(mockPasswordResetToken);

  // Password comparison
  ;(compare as jest.Mock).mockResolvedValue(true);

  // Email mocks
  ;(sendVerificationEmail as jest.Mock).mockResolvedValue({ id: "email-123" });
  ;(sendPasswordResetEmail as jest.Mock).mockResolvedValue({ id: "email-123" });
  ;(sendMagicLinkEmail as jest.Mock).mockResolvedValue({ id: "email-123" });

  // Token function mocks
  ;(generateVerificationToken as jest.Mock).mockResolvedValue(mockVerificationToken);
  ;(generatePasswordResetToken as jest.Mock).mockResolvedValue(mockPasswordResetToken);
  ;(getVerificationTokenByToken as jest.Mock).mockResolvedValue(mockVerificationToken);
  ;(getVerificationTokenByEmail as jest.Mock).mockResolvedValue(mockVerificationToken);
  ;(deleteVerificationToken as jest.Mock).mockResolvedValue(undefined);
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
  fullName: 'Test User',
}