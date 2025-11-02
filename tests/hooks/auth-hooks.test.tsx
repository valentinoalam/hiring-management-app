import { renderHook, waitFor } from '@testing-library/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSignInMagicLink, useSignInCredentials, useSignUpWithEmail } from '@/hooks/queries/auth-queries'
import { createWrapper } from '../setup/auth-test-utils'

// Mock the actions
jest.mock('@/app/login/action', () => ({
  signInCredentials: jest.fn(),
  signInMagicLink: jest.fn(),
}))

jest.mock('@/app/sign-up/action', () => ({
  signUpWithEmail: jest.fn(),
}))

const { signInCredentials, signInMagicLink } = require('@/app/login/action')
const { signUpWithEmail } = require('@/app/sign-up/action')

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