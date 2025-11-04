/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/(auth)/login/page'
import SignUpPage from '@/app/(auth)/sign-up/page'
import { createWrapper } from '../setup/auth-test-utils'
import { signInCredentials, signInMagicLink, signInOAuth } from '@/app/(auth)/login/action'
import { signUpWithEmail } from '@/app/(auth)/sign-up/action'

describe('Auth Flow Integration', () => {
  const user = userEvent.setup()
  const wrapper = createWrapper()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    })
  })

  describe('Complete Login Flow', () => {
    it('completes magic link login flow', async () => {
      ;(signInMagicLink as jest.Mock).mockResolvedValue({ success: true })

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
        expect(signInMagicLink).toHaveBeenCalledTimes(2)
      })
    })

    it('completes password login flow with redirect', async () => {
      ;(signInCredentials as jest.Mock).mockResolvedValue({ 
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
      ;(signInCredentials as jest.Mock).mockResolvedValue({ 
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
      ;(signUpWithEmail as jest.Mock).mockResolvedValue({ success: true })

      render(<SignUpPage />, { wrapper })

      // Step 1: Enter email and submit
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'newuser@example.com')

      const submitButton = screen.getByRole('button', { name: /daftar dengan email/i })
      await user.click(submitButton)

      // Step 2: Verify success state
      await waitFor(() => {
        expect(screen.getByText(/pendaftaran berhasil/i)).toBeInTheDocument()
      })

      // Step 3: Verify email is displayed
      expect(screen.getByText('newuser@example.com')).toBeInTheDocument()

      // Step 4: Test "Use Different Email" functionality
      const differentEmailButton = screen.getByRole('button', { name: /gunakan email lain/i })
      await user.click(differentEmailButton)

      // Step 5: Verify back to form
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
  })

  describe('Navigation Between Auth Pages', () => {
    it('navigates from login to signup', async () => {
      render(<LoginPage />, { wrapper })

      const signupLink = screen.getByText(/daftar menggunakan email/i)
      await user.click(signupLink)

      // In a real app, this would navigate to /sign-up
      // We're testing that the link is present and clickable
      expect(signupLink).toHaveAttribute('href', '/sign-up')
    })

    it('navigates from signup to login', async () => {
      render(<SignUpPage />, { wrapper })

      const loginLink = screen.getByText(/masuk ke akun anda/i)
      await user.click(loginLink)

      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })
})