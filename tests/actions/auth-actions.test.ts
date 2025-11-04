import { signUpCredentials, signInOAuth } from '@/app/(auth)/sign-up/action'
import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock the auth module BEFORE imports
jest.mock('@/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  auth: jest.fn(),
}))

// Mock next-auth
jest.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string
    constructor(message: string) {
      super(message)
      this.type = 'AuthError'
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    profile: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      user: {
        create: jest.fn(),
      },
      profile: {
        create: jest.fn(),
      },
    })),
  },
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}))

// Mock tokens
jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
}))

// Mock email
jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}))


describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUpCredentials', () => {
    it('should create user successfully with valid data', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('password', 'Password123!')
      mockFormData.append('fullName', 'Test User')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(redirect as unknown as jest.Mock).mockImplementation((url) => {
        throw new Error(`NEXT_REDIRECT: ${url}`)
      })

      try {
        await signUpCredentials(mockFormData)
      } catch (error: unknown) {
        expect((error as Error).message).toContain('verify-request')
      }

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should return error for missing fields', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      // Missing password and fullName

      const result = await signUpCredentials(mockFormData)

      expect(result).toEqual({ 
        success: false, 
        error: 'MISSING_REQUIRED_FIELDS' 
      })
    })

    it('should return error for invalid email', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'invalid-email')
      mockFormData.append('password', 'Password123!')
      mockFormData.append('fullName', 'Test User')

      const result = await signUpCredentials(mockFormData)

      expect(result).toEqual({ 
        success: false, 
        error: 'INVALID_EMAIL_FORMAT' 
      })
    })

    it('should return error for short password', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('password', '12345')
      mockFormData.append('fullName', 'Test User')

      const result = await signUpCredentials(mockFormData)

      expect(result).toEqual({ 
        success: false, 
        error: 'PASSWORD_TOO_SHORT' 
      })
    })

    it('should return error for existing email', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('password', 'Password123!')
      mockFormData.append('fullName', 'Test User')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      })

      const result = await signUpCredentials(mockFormData)

      expect(result).toEqual({ 
        success: false, 
        error: 'EMAIL_ALREADY_EXISTS' 
      })
    })
  })

  describe('signInOAuth', () => {
    it('should initiate OAuth flow', async () => {
      ;(signIn as jest.Mock).mockRejectedValue({ 
        url: 'https://accounts.google.com/oauth',
      })

      try {
        await signInOAuth('google', '/dashboard')
      } catch (error: unknown) {
        expect((error as { url: string }).url).toBe('https://accounts.google.com/oauth')
      }

      expect(signIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard',
        redirect: true,
      })
    })
  })
})