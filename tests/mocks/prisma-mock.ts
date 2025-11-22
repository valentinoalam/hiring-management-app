// __mocks__/@/generated/prisma/client.ts or __mocks__/@/generated/prisma/client/index.ts

import { jest } from '@jest/globals';
import { PrismaClient } from '@/generated/prisma/client'; // Import actual types for safety

// 1. Create a mocked implementation for each model
const mockUser = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  // Add other methods you use (e.g., updateMany, upsert)
};

const mockProfile = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockJob = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockApplication = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// ... Repeat for all your models (e.g., Account, Company, InfoField, etc.)

// 2. Combine all mocks into the client instance
const mockPrismaClient = {
  user: mockUser,
  profile: mockProfile,
  job: mockJob,
  application: mockApplication,
  // ... Include all other models here
  
  // Also mock the $transaction method if you use it
  $transaction: jest.fn((cb: (prisma: typeof mockPrismaClient) => unknown) => cb(mockPrismaClient)),
  
  // Mock connection methods, though they might not be used in tests
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// 3. Export the mocked client instance
// Named export for the default client instance
export const prisma = mockPrismaClient as unknown as PrismaClient;

// Default export as constructor function
export default function MockPrismaClient() {
  return mockPrismaClient as unknown as PrismaClient;
}