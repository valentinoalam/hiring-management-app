import { render, screen } from "@testing-library/react"
import { ApplicationFeedback } from "../job-seeker/application-feedback"

describe("ApplicationFeedback", () => {
  it("should render success state", () => {
    render(<ApplicationFeedback state="success" message="Your application has been submitted successfully." />)
    expect(screen.getByText(/submitted successfully/i)).toBeInTheDocument()
  })

  it("should render error state", () => {
    render(
      <ApplicationFeedback state="error" message="Failed to submit application" errors={{ email: "Invalid email" }} />,
    )
    expect(screen.getByText(/failed to submit/i)).toBeInTheDocument()
  })

  it("should display field errors", () => {
    render(
      <ApplicationFeedback
        state="error"
        message="Please fix the following errors"
        errors={{ email: "Invalid email", phone: "Invalid phone" }}
      />,
    )
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    expect(screen.getByText(/invalid phone/i)).toBeInTheDocument()
  })

  it("should render loading state", () => {
    render(<ApplicationFeedback state="loading" message="Submitting your application..." />)
    expect(screen.getByText(/submitting/i)).toBeInTheDocument()
  })
})
