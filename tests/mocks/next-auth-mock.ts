// next-auth-mock.ts
const NextAuth = jest.fn(() => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

export default NextAuth;

// Mock NextAuth providers
jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({ 
    id: "google", 
    name: "Google",
    clientId: "mock-google-client-id",
    clientSecret: "mock-google-client-secret",
  })),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn(() => ({ 
    id: "credentials", 
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "email@example.com" },
      password: { label: "Password", type: "password" },
    },
    authorize: jest.fn(),
  })),
}));

jest.mock("next-auth/providers/nodemailer", () => ({
  __esModule: true,
  default: jest.fn(() => ({ 
    id: "email", 
    name: "Email",
    server: {
      host: "mock-smtp-host",
      port: 587,
      auth: {
        user: "mock-email-user",
        pass: "mock-email-password",
      },
    },
    from: "mock-from@example.com",
  })),
}));

// Mock Prisma adapter
jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserByAccount: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    getSessionAndUser: jest.fn(),
    createSession: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
    createVerificationToken: jest.fn(),
    useVerificationToken: jest.fn(),
  })),
}));

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  compare: jest.fn(() => Promise.resolve(true)),
  hash: jest.fn(() => Promise.resolve("hashed-password")),
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-token-123"),
}));

// Mock Resend email service
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(() => Promise.resolve({ 
        data: { id: "email-123" }, 
        error: null 
      })),
    },
  })),
}));

// Mock email functions
jest.mock("@/lib/email", () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve({ id: "email-123" })),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve({ id: "email-123" })),
  sendMagicLinkEmail: jest.fn(() => Promise.resolve({ id: "email-123" })),
}));

// Mock token functions
jest.mock("@/lib/tokens", () => ({
  generateVerificationToken: jest.fn(() => Promise.resolve({
    id: "token-123",
    identifier: "test@example.com",
    token: "mock-verification-token",
    expires: new Date(Date.now() + 3600 * 1000),
  })),
  generatePasswordResetToken: jest.fn(() => Promise.resolve({
    id: "token-123",
    email: "test@example.com",
    token: "mock-password-reset-token",
    expires: new Date(Date.now() + 3600 * 1000),
  })),
  getVerificationTokenByToken: jest.fn(() => Promise.resolve({
    id: "token-123",
    identifier: "test@example.com",
    token: "mock-verification-token",
    expires: new Date(Date.now() + 3600 * 1000),
  })),
  getVerificationTokenByEmail: jest.fn(() => Promise.resolve({
    id: "token-123",
    identifier: "test@example.com",
    token: "mock-verification-token",
    expires: new Date(Date.now() + 3600 * 1000),
  })),
  deleteVerificationToken: jest.fn(() => Promise.resolve()),
}));

// Mock Prisma client with token tables
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirstOrThrow: jest.fn(),
      create: jest.fn(),
    },
    profile: {
      create: jest.fn(),
    },
    verificationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

// Mock environment variables
process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret";
process.env.EMAIL_SERVER_HOST = "mock-smtp-host";
process.env.EMAIL_SERVER_PORT = "587";
process.env.EMAIL_SERVER_USER = "mock-email-user";
process.env.EMAIL_SERVER_PASSWORD = "mock-email-password";
process.env.EMAIL_FROM = "mock-from@example.com";
process.env.NEXTAUTH_SECRET = "mock-nextauth-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "mock-resend-api-key";
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
  configurable: true
});