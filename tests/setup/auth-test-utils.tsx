/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

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
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'USER' as const,
}

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