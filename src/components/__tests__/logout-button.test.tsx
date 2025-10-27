import { render, screen } from "@testing-library/react"
import { LogoutButton } from "../custom-ui/auth/logout-button"
import jest from "jest" // Import jest to fix the undeclared variable error

jest.mock("@/lib/auth/hooks", () => ({
  useLogout: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}))

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

describe("LogoutButton", () => {
  it("should render logout button", () => {
    render(<LogoutButton />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("should have correct text", () => {
    render(<LogoutButton />)
    expect(screen.getByText(/logout/i)).toBeInTheDocument()
  })

  it("should be clickable", () => {
    render(<LogoutButton />)
    const button = screen.getByRole("button")
    expect(button).not.toBeDisabled()
  })
})
