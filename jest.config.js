// import type { Config } from 'jest';
import nextJest from 'next/jest.js';
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // 1. ADD THE SETUP FILE PATH HERE
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  collectCoverageFrom: [
    "lib/**/*.{js,jsx,ts,tsx}",
    "hooks/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
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
  // 2. ADD THIS TO PREVENT IT FROM BEING RUN AS A TEST
  testPathIgnorePatterns: ["<rootDir>/tests/setup.ts"], 
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
