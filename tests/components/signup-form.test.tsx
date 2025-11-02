import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock components
const SignUpPage = () => <div data-testid="signup-page">Sign Up Page</div>
SignUpPage.displayName = 'SignUpPage'

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
const signUpWithEmail = jest.fn()
const signInOAuth = jest.fn()

describe('SignUp Page', () => {
  const user = userEvent.setup()
  const wrapper = createWrapper()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders signup form correctly', () => {
    render(<SignUpPage />, { wrapper })

    expect(screen.getByText('Daftar ke Rakamin')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /daftar dengan email/i })).toBeInTheDocument()
    expect(screen.getByText(/daftar dengan google/i)).toBeInTheDocument()
    expect(screen.getByText(/syarat & ketentuan/i)).toBeInTheDocument()
  })

  it('submits signup form successfully', async () => {
    ;(signUpWithEmail as jest.Mock).mockResolvedValue({ success: true })

    render(<SignUpPage />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /daftar dengan email/i })

    await user.type(emailInput, mockFormData.email)
    await user.click(submitButton)

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith(mockFormData.email, undefined)
    })

    expect(await screen.findByText(/pendaftaran berhasil/i)).toBeInTheDocument()
  })

  it('shows error when email already exists', async () => {
    ;(signUpWithEmail as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: 'EMAIL_ALREADY_EXISTS' 
    })

    render(<SignUpPage />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /daftar dengan email/i })

    await user.type(emailInput, mockFormData.email)
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email sudah terdaftar/i)).toBeInTheDocument()
    })
  })

  it('initiates Google OAuth signup', async () => {
    ;(signInOAuth as jest.Mock).mockResolvedValue({ success: true })

    render(<SignUpPage />, { wrapper })

    const googleButton = screen.getByText(/daftar dengan google/i)
    await user.click(googleButton)

    expect(signInOAuth).toHaveBeenCalledWith('google', undefined)
  })

  it('validates email format', async () => {
    render(<SignUpPage />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /daftar dengan email/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument()
  })
})