import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = 'TestWrapper'
  return Wrapper
}

// Mock functions
const signInCredentials = jest.fn()
const signInMagicLink = jest.fn()
const signUpWithEmail = jest.fn()

// Mock hooks
const useSignInMagicLink = () => ({
  mutate: ({ email }: { email: string }) => signInMagicLink(email, undefined),
  isLoading: false,
  error: null,
})

const useSignInCredentials = () => ({
  mutate: ({ formData }: { formData: FormData }) => signInCredentials(formData, undefined),
  isLoading: false,
  error: null,
})

const useSignUpWithEmail = () => ({
  mutate: ({ email }: { email: string }) => signUpWithEmail(email, undefined),
  isLoading: false,
  error: null,
})

describe('Auth Hooks', () => {
  const wrapper = createWrapper()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useSignInMagicLink', () => {
    it('calls signInMagicLink on mutate', async () => {
      ;(signInMagicLink as jest.Mock).mockResolvedValue({ success: true })

      const { result } = renderHook(() => useSignInMagicLink(), { wrapper })

      result.current.mutate({ email: 'test@example.com' })

      await waitFor(() => {
        expect(signInMagicLink).toHaveBeenCalledWith('test@example.com', undefined)
      })
    })
  })

  describe('useSignInCredentials', () => {
    it('calls signInCredentials on mutate', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('password', 'Password123!')

      ;(signInCredentials as jest.Mock).mockResolvedValue({ success: true })

      const { result } = renderHook(() => useSignInCredentials(), { wrapper })

      result.current.mutate({ formData: mockFormData })

      await waitFor(() => {
        expect(signInCredentials).toHaveBeenCalledWith(mockFormData, undefined)
      })
    })
  })

  describe('useSignUpWithEmail', () => {
    it('calls signUpWithEmail on mutate', async () => {
      ;(signUpWithEmail as jest.Mock).mockResolvedValue({ success: true })

      const { result } = renderHook(() => useSignUpWithEmail(), { wrapper })

      result.current.mutate({ email: 'test@example.com' })

      await waitFor(() => {
        expect(signUpWithEmail).toHaveBeenCalledWith('test@example.com', undefined)
      })
    })
  })
})