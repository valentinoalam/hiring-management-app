import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

interface SignUpPayload {
  email: string
  password: string
  role: "recruiter" | "job_seeker"
  fullName?: string
}

interface SignInPayload {
  email: string
  password: string
}

export function useSignUp() {
  return useMutation({
    mutationFn: async (payload: SignUpPayload) => {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Sign up failed")
      }

      return response.json()
    },
  })
}

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SignInPayload) => {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Sign in failed")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Sign out failed")
      }

      return response.json()
    },
    onSuccess: () => {
      // Clear all queries on sign out
      queryClient.clear()
    },
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me")

      if (!response.ok) {
        if (response.status === 401) {
          return null
        }
        throw new Error("Failed to fetch current user")
      }

      return response.json()
    },
    retry: false,
  })
}
