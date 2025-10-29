"use client"

import "@testing-library/jest-dom"
import jest from "jest"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ""
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock MediaPipe
global.FilesetResolver = {
  forVisionTasks: jest.fn(),
}

global.HandLandmarker = {
  createFromOptions: jest.fn(),
}
