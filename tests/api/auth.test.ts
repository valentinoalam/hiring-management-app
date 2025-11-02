import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Credentials Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      // Mock user exists with correct password
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        fullName: 'Test User',
        role: 'USER',
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)
      const { compare } = require('bcryptjs')
      compare.mockResolvedValue(true)

      const response = await POST(req)
      const data = await response.json()

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(data).toMatchObject({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      })
    })

    it('should reject invalid credentials', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      })

      prisma.user.findUnique.mockResolvedValue(null)

      const response = await POST(req)
      expect(response.status).toBe(401)
    })
  })
})