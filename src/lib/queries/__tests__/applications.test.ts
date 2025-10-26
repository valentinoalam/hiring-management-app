import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useApplications, useApplicationById } from "../applications"
import React from "react"
import jest from "jest" // Import jest to fix the undeclared variable error

jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: "1",
            job_id: "job-1",
            applicant_id: "user-1",
            status: "pending",
            created_at: new Date().toISOString(),
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

describe("Applications Queries", () => {
  it("should fetch applications for a job", async () => {
    const { result } = renderHook(() => useApplications("job-1"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it("should fetch single application by ID", async () => {
    const { result } = renderHook(() => useApplicationById("app-1"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })
})
