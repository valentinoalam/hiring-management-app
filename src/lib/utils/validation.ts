export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+$$$$]{10,}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateFormField(
  value: any,
  fieldType: string,
  required: boolean,
): { valid: boolean; error?: string } {
  if (required && !value) {
    return { valid: false, error: "This field is required" }
  }

  if (!value) {
    return { valid: true }
  }

  switch (fieldType) {
    case "email":
      return {
        valid: validateEmail(value),
        error: !validateEmail(value) ? "Invalid email address" : undefined,
      }
    case "phone":
      return {
        valid: validatePhoneNumber(value),
        error: !validatePhoneNumber(value) ? "Invalid phone number" : undefined,
      }
    case "url":
      return {
        valid: validateURL(value),
        error: !validateURL(value) ? "Invalid URL" : undefined,
      }
    default:
      return { valid: true }
  }
}
