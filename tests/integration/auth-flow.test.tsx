/* eslint-disable @typescript-eslint/no-unused-vars */
// tests/integration/auth-flow.test.tsx
import React from 'react'
import { createWrapper, render, screen, setupAuthMocks, setupRouterMock, waitFor } from '../setup/auth-test-utils'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(auth)/login/page'
import SignUpPage from '@/app/(auth)/sign-up/page'
import { signInCredentials, signInMagicLink, signInOAuth } from '@/app/(auth)/login/action'
import { signUpWithEmail } from '@/app/(auth)/sign-up/action'
import { toast } from 'sonner'

// Cast the mocks to jest.Mock for TypeScript
const mockSignInCredentials = signInCredentials as jest.Mock
const mockSignInMagicLink = signInMagicLink as jest.Mock
const mockSignUpWithEmail = signUpWithEmail as jest.Mock

describe('Auth Flow Integration', () => {
  const user = userEvent.setup()
  const wrapper = createWrapper()

  beforeEach(() => {
    jest.clearAllMocks()
    setupAuthMocks()
  })

  describe('Complete Login Flow', () => {
    it('completes magic link login flow', async () => {
      const { mockPush } = setupRouterMock()
      mockSignInMagicLink.mockResolvedValue({ success: true })

      render(<LoginPage />, { wrapper })

      // Step 1: Enter email and send magic link
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')
      
      const magicLinkButton = screen.getByRole('button', { name: /kirim magic link/i })
      await user.click(magicLinkButton)

      // Step 2: Verify success message appears
      await waitFor(() => {
        expect(screen.getByText(/periksa email anda/i)).toBeInTheDocument()
      })

      // Step 3: Verify email is displayed
      expect(screen.getByText('test@example.com')).toBeInTheDocument()

      // Step 4: Test resend functionality
      const resendButton = screen.getByRole('button', { name: /kirim ulang magic link/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(mockSignInMagicLink).toHaveBeenCalledTimes(2)
      })
    })

    it('completes password login flow with redirect', async () => {
      const { mockPush } = setupRouterMock()
      mockSignInCredentials.mockResolvedValue({ 
        success: true, 
        url: '/dashboard' 
      })

      render(<LoginPage />, { wrapper })

      // Step 1: Enter email
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')

      // Step 2: Switch to password mode
      const passwordButton = screen.getByText(/masuk dengan password/i)
      await user.click(passwordButton)

      // Step 3: Enter password
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, 'Password123!')

      // Step 4: Submit
      const submitButton = screen.getByRole('button', { name: /masuk dengan password/i })
      await user.click(submitButton)

      // Step 5: Verify redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('handles login error flow', async () => {
      setupRouterMock()
      mockSignInCredentials.mockResolvedValue({ 
        success: false, 
        error: 'INVALID_CREDENTIALS' 
      })

      render(<LoginPage />, { wrapper })

      // Enter credentials
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')

      const passwordButton = screen.getByText(/masuk dengan password/i)
      await user.click(passwordButton)

      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: /masuk dengan password/i })
      await user.click(submitButton)

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })
  })

  describe('Complete Signup Flow', () => {
    it('completes email signup flow', async () => {
      const { mockPush } = setupRouterMock()
      mockSignUpWithEmail.mockResolvedValue({ 
        success: true,
        redirectUrl: '/verify-request'
      })

      render(<SignUpPage />, { wrapper })

      // Step 1: Enter email and submit
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'newuser@example.com')

      const submitButton = screen.getByRole('button', { name: /daftar dengan email/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.loading).toHaveBeenCalledWith('Mendaftarkan akun...')
      })

      // Step 2: Verify success state
      await waitFor(() => {
        expect(toast.dismiss).toHaveBeenCalled() // Loading toast dismissed
        expect(toast.success).toHaveBeenCalledWith("Pendaftaran Berhasil!", 
          expect.objectContaining({
            description: "Akun Anda telah berhasil dibuat. Silakan verifikasi email Anda.",
            duration: 4000,
          })
        )
      })
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify-request')
      }, { timeout: 2000 })
      // // Step 3: Verify email is displayed
      // expect(screen.getByText('newuser@example.com')).toBeInTheDocument()

      // // Step 4: Test "Use Different Email" functionality
      // const differentEmailButton = screen.getByRole('button', { name: /gunakan email lain/i })
      // await user.click(differentEmailButton)

      // Step 5: Verify back to form
      // expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
  })

  describe('Navigation Between Auth Pages', () => {
    const callbackUrl = '/'
    it('navigates from login to signup', async () => {
      setupRouterMock()
      render(<LoginPage />, { wrapper })

      const signupLink = screen.getByRole('link', { name: /Daftar menggunakan email/i })
      
      // Verify the link points to signup page
      expect(signupLink.getAttribute('href')).toBe(`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    })

    it('navigates from signup to login', async () => {
      const callbackUrl = '/'
      setupRouterMock()
      render(<SignUpPage />, { wrapper })
      // Debug: see all text content
      screen.debug()
      const allLinks = screen.getAllByRole('link')
      allLinks.forEach(link => {
        console.log('Link found:', link.textContent, link.getAttribute('href'))
      })

      // Try different queries
      const loginLink = screen.getByRole('link', { name: /masuk/i })
      expect(loginLink.getAttribute('href')).toBe(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    })
  })
})