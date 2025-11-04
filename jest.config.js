// import type { Config } from 'jest';
import nextJest from 'next/jest.js';
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^next-auth$": "<rootDir>/tests/mocks/next-auth-mock.ts",
    "^@/lib/prisma$": "<rootDir>/tests/mocks/prisma-mock.ts",
  },
  testMatch: ["**/tests/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  collectCoverageFrom: [
    "@/lib/**/*.{js,jsx,ts,tsx}",
    "@/hooks/**/*.{js,jsx,ts,tsx}",
    "@/components/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  transformIgnorePatterns: [
    // This regex tells Jest to NOT ignore node_modules
    // that contain next-auth or its internal dependency @auth/core.
    // We explicitly list the modules that need transpilation.
    '/node_modules/(?!(next-auth|@auth/core|jose)/)',
    "/node_modules/(?!(?:@auth/prisma-adapter)/)", // 👈 força Jest a transpilar prisma-adapter
  ],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest', 
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/setup.ts"], 
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
