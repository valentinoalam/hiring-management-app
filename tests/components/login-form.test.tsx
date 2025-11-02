import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock components
const LoginPage = () => <div data-testid="login-page">Login Page</div>
LoginPage.displayName = 'LoginPage'

// Mock utilities
const createWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  Wrapper.displayName = 'TestWrapper'
  return Wrapper
}

const mockFormData = {
  email: 'test@example.com',
  password: 'Password123!'
}

// Mock functions
const signInCredentials = jest.fn()
const signInMagicLink = jest.fn()
const signInOAuth = jest.fn()

describe('Login Page', () => {
  const user = userEvent.setup()
  const wrapper = createWrapper()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginPage />, { wrapper })

    expect(screen.getByText('Masuk ke Rakamin')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /kirim magic link/i })).toBeInTheDocument()
    expect(screen.getByText(/masuk dengan password/i)).toBeInTheDocument()
    expect(screen.getByText(/masuk dengan google/i)).toBeInTheDocument()
  })

  describe('Magic Link Login', () => {
    it('submits magic link form successfully', async () => {
      ;(signInMagicLink as jest.Mock).mockResolvedValue({ success: true })

      render(<LoginPage />, { wrapper })

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /kirim magic link/i })

      await user.type(emailInput, mockFormData.email)
      await user.click(submitButton)

      await waitFor(() => {
        expect(signInMagicLink).toHaveBeenCalledWith(mockFormData.email, undefined)
      })

      expect(await screen.findByText(/periksa email anda/i)).toBeInTheDocument()
    })

    it('shows error when magic link fails', async () => {
      ;(signInMagicLink as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'Failed to send email' 
      })

      render(<LoginPage />, { wrapper })

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /kirim magic link/i })

      await user.type(emailInput, mockFormData.email)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to send email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Password Login', () => {
    it('switches to password mode and submits successfully', async () => {
      ;(signInCredentials as jest.Mock).mockResolvedValue({ success: true })

      render(<LoginPage />, { wrapper })

      // Enter email first
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, mockFormData.email)

      // Switch to password mode
      const passwordButton = screen.getByText(/masuk dengan password/i)
      await user.click(passwordButton)

      // Enter password and submit
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, mockFormData.password)

      const submitButton = screen.getByRole('button', { name: /masuk dengan password/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(signInCredentials).toHaveBeenCalled()
      })
    })

    it('validates required fields in password mode', async () => {
      render(<LoginPage />, { wrapper })

      // Switch to password mode without entering email
      const passwordButton = screen.getByText(/masuk dengan password/i)
      await user.click(passwordButton)

      const submitButton = screen.getByRole('button', { name: /masuk dengan password/i })
      await user.click(submitButton)

      expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  describe('OAuth Login', () => {
    it('initiates Google OAuth flow', async () => {
      ;(signInOAuth as jest.Mock).mockResolvedValue({ success: true })

      render(<LoginPage />, { wrapper })

      const googleButton = screen.getByText(/masuk dengan google/i)
      await user.click(googleButton)

      expect(signInOAuth).toHaveBeenCalledWith('google', undefined)
    })
  })

  describe('Form Validation', () => {
    it('validates email format', async () => {
      render(<LoginPage />, { wrapper })

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /kirim magic link/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    it('validates password length', async () => {
      render(<LoginPage />, { wrapper })

      // Enter email and switch to password mode
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, mockFormData.email)

      const passwordButton = screen.getByText(/masuk dengan password/i)
      await user.click(passwordButton)

      // Enter short password
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, '123')

      const submitButton = screen.getByRole('button', { name: /masuk dengan password/i })
      await user.click(submitButton)

      expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })
})