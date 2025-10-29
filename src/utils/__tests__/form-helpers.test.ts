import { filterFormFields, sortFormFields, validateFormData } from "../form-helpers"

describe("Form Helpers", () => {
  const mockFields = [
    { id: "1", name: "fullName", label: "Full Name", required: true, type: "text", order: 1 },
    { id: "2", name: "email", label: "Email", required: true, type: "email", order: 2 },
    { id: "3", name: "phone", label: "Phone", required: false, type: "phone", order: 3 },
  ]

  describe("filterFormFields", () => {
    it("should filter fields by visibility", () => {
      const fieldsWithVisibility = mockFields.map((f, i) => ({
        ...f,
        visibility: i === 0 ? "mandatory" : i === 1 ? "optional" : "hidden",
      }))

      const result = filterFormFields(fieldsWithVisibility, "hidden")
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("phone")
    })
  })

  describe("sortFormFields", () => {
    it("should sort fields by order", () => {
      const unsorted = [mockFields[2], mockFields[0], mockFields[1]]
      const result = sortFormFields(unsorted)
      expect(result[0].order).toBe(1)
      expect(result[1].order).toBe(2)
      expect(result[2].order).toBe(3)
    })
  })

  describe("validateFormData", () => {
    it("should validate required fields", () => {
      const data = { fullName: "", email: "test@example.com" }
      const result = validateFormData(data, mockFields)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveProperty("fullName")
    })

    it("should pass validation with all required fields", () => {
      const data = { fullName: "John Doe", email: "test@example.com", phone: "" }
      const result = validateFormData(data, mockFields)
      expect(result.valid).toBe(true)
    })
  })
})
