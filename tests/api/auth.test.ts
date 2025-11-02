// Mock utilities
const createMocks = (options: { method: string; body: unknown }) => ({
  req: { method: options.method, body: options.body },
  res: { status: jest.fn(), json: jest.fn() }
})

// Mock POST handler
const POST = jest.fn()

// Mock prisma
const mockFindUnique = jest.fn()
const mockCreate = jest.fn()
const prisma = {
  user: {
    findUnique: mockFindUnique,
    create: mockCreate,
  },
}

// Mock bcryptjs
const compare = jest.fn()
const hash = jest.fn()

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

      mockFindUnique.mockResolvedValue(mockUser)
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

      mockFindUnique.mockResolvedValue(null)

      const response = await POST(req)
      expect(response.status).toBe(401)
    })
  })
})