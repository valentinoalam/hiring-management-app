import { signInCredentials, signInMagicLink, signInOAuth } from '@/app/login/action'
import { signUpWithEmail } from '@/app/sign-up/action'
import { signIn } from 'next-auth/react'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signInCredentials', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('password', 'Password123!')

      ;(signIn as jest.Mock).mockResolvedValue({ 
        success: true, 
        url: '/dashboard' 
      })

      const result = await signInCredentials(mockFormData)

      expect(signIn).toHaveBeenCalledWith('password', {
        email: 'test@example.com',
        password: 'Password123!',
        redirect: false,
        redirectTo: '/',
      })
      expect(result).toEqual({ success: true, url: '/dashboard' })
    })

    it('should handle invalid credentials', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('password', 'wrongpassword')

      ;(signIn as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'Invalid credentials' 
      })

      const result = await signInCredentials(mockFormData)

      expect(result).toEqual({ 
        success: false, 
        error: 'Invalid credentials' 
      })
    })
  })

  describe('signInMagicLink', () => {
    it('should send magic link successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await signInMagicLink('test@example.com')

      expect(fetch).toHaveBeenCalledWith('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })
      expect(result).toEqual({ success: true })
    })

    it('should handle magic link failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to send magic link' }),
      })

      const result = await signInMagicLink('test@example.com')

      expect(result).toEqual({ 
        success: false, 
        error: 'Failed to send magic link' 
      })
    })
  })

  describe('signInOAuth', () => {
    it('should initiate OAuth flow', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ success: true })

      await signInOAuth('google')

      expect(signIn).toHaveBeenCalledWith('google', {
        redirectTo: '/',
      })
    })
  })

  describe('signUpWithEmail', () => {
    it('should register user successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await signUpWithEmail('test@example.com')

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })
      expect(result).toEqual({ success: true })
    })

    it('should handle registration failure', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      })

      const result = await signUpWithEmail('test@example.com')

      expect(result).toEqual({ 
        success: false, 
        error: 'Email already exists' 
      })
    })
  })
})