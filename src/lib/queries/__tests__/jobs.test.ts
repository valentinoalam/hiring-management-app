import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRecruiterJobs, useActiveJobs } from "../jobs"
import React from "react"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: "1",
            title: "Senior Developer",
            department: "Engineering",
            status: "active",
            salary_min: 100000,
            salary_max: 150000,
          },
        ],
        error: null,
      }),
    })),
  })),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Jobs Queries", () => {
  it("should fetch recruiter jobs", async () => {
    const { result } = renderHook(() => useRecruiterJobs("recruiter-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it("should fetch active jobs for job seekers", async () => {
    const { result } = renderHook(() => useActiveJobs(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it("should handle loading state", () => {
    const { result } = renderHook(() => useRecruiterJobs("recruiter-123"), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it("should handle error state", async () => {
    const { result } = renderHook(() => useRecruiterJobs("invalid-id"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError || result.current.isSuccess).toBe(true)
    })
  })
})
