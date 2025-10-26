describe("Test Setup", () => {
  it("should have Jest configured correctly", () => {
    expect(true).toBe(true)
  })

  it("should have testing library available", () => {
    expect(require("@testing-library/react")).toBeDefined()
  })

  it("should have jest-dom matchers available", () => {
    const element = document.createElement("div")
    expect(element).toBeInTheDocument()
  })
})
