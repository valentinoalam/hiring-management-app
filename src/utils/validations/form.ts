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
  value: unknown,
  fieldType: string,
  required: boolean,
): { valid: boolean; error?: string } {
  if (required && !value) {
    return { valid: false, error: "This field is required" }
  }

  if (!value) {
    return { valid: true }
  }

  const stringValue = String(value);

  switch (fieldType) {
    case "email":
      return {
        valid: validateEmail(stringValue),
        error: !validateEmail(stringValue) ? "Invalid email address" : undefined,
      }
    case "phone":
      return {
        valid: validatePhoneNumber(stringValue),
        error: !validatePhoneNumber(stringValue) ? "Invalid phone number" : undefined,
      }
    case "url":
      return {
        valid: validateURL(stringValue),
        error: !validateURL(stringValue) ? "Invalid URL" : undefined,
      }
    default:
      return { valid: true }
  }
}
