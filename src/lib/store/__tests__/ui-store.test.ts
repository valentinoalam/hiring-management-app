import { renderHook, act } from "@testing-library/react"
import { useUIStore } from "../ui-store"

describe("UI Store", () => {
  beforeEach(() => {
    useUIStore.setState({
      jobFilters: { status: "all", searchQuery: "" },
      candidateFilters: { status: "all", searchQuery: "" },
      columnOrder: [],
      columnWidths: {},
      isCreateJobModalOpen: false,
    })
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useUIStore())
    expect(result.current.jobFilters.status).toBe("all")
    expect(result.current.isCreateJobModalOpen).toBe(false)
  })

  it("should update job filters", () => {
    const { result } = renderHook(() => useUIStore())

    act(() => {
      result.current.setJobFilters({ status: "active", searchQuery: "engineer" })
    })

    expect(result.current.jobFilters.status).toBe("active")
    expect(result.current.jobFilters.searchQuery).toBe("engineer")
  })

  it("should toggle create job modal", () => {
    const { result } = renderHook(() => useUIStore())

    act(() => {
      result.current.setIsCreateJobModalOpen(true)
    })

    expect(result.current.isCreateJobModalOpen).toBe(true)

    act(() => {
      result.current.setIsCreateJobModalOpen(false)
    })

    expect(result.current.isCreateJobModalOpen).toBe(false)
  })

  it("should update column order", () => {
    const { result } = renderHook(() => useUIStore())
    const newOrder = ["name", "email", "phone"]

    act(() => {
      result.current.setColumnOrder(newOrder)
    })

    expect(result.current.columnOrder).toEqual(newOrder)
  })

  it("should update column widths", () => {
    const { result } = renderHook(() => useUIStore())
    const widths = { name: 200, email: 250 }

    act(() => {
      result.current.setColumnWidths(widths)
    })

    expect(result.current.columnWidths).toEqual(widths)
  })
})
