import { validateEmail, validatePhoneNumber, validateURL } from "../validations/form"

describe("Validation Utilities", () => {
  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true)
      expect(validateEmail("user.name+tag@example.co.uk")).toBe(true)
    })

    it("should reject invalid email addresses", () => {
      expect(validateEmail("invalid.email")).toBe(false)
      expect(validateEmail("test@")).toBe(false)
      expect(validateEmail("@example.com")).toBe(false)
    })
  })

  describe("validatePhoneNumber", () => {
    it("should validate correct phone numbers", () => {
      expect(validatePhoneNumber("+1234567890")).toBe(true)
      expect(validatePhoneNumber("1234567890")).toBe(true)
    })

    it("should reject invalid phone numbers", () => {
      expect(validatePhoneNumber("123")).toBe(false)
      expect(validatePhoneNumber("abc")).toBe(false)
    })
  })

  describe("validateURL", () => {
    it("should validate correct URLs", () => {
      expect(validateURL("https://example.com")).toBe(true)
      expect(validateURL("http://www.example.com")).toBe(true)
    })

    it("should reject invalid URLs", () => {
      expect(validateURL("not a url")).toBe(false)
      expect(validateURL("example.com")).toBe(false)
    })
  })
})
