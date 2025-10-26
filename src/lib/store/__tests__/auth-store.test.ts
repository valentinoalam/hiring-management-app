import { renderHook, act } from "@testing-library/react"
import { useAuthStore } from "../auth-store"

describe("Auth Store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      recruiterProfile: null,
      jobSeekerProfile: null,
      loading: false,
    })
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it("should set user and profile", () => {
    const { result } = renderHook(() => useAuthStore())
    const mockUser = { id: "123", email: "test@example.com" }
    const mockProfile = { id: "123", role: "recruiter" }

    act(() => {
      result.current.setUser(mockUser as any)
      result.current.setProfile(mockProfile as any)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.profile).toEqual(mockProfile)
  })

  it("should set loading state", () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.loading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.loading).toBe(false)
  })

  it("should clear auth state on logout", () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser({ id: "123", email: "test@example.com" } as any)
      result.current.setProfile({ id: "123", role: "recruiter" } as any)
    })

    expect(result.current.user).not.toBeNull()

    act(() => {
      result.current.clearAuth()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
  })
})
