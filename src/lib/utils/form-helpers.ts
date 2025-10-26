export interface FormField {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  order: number
  visibility?: "mandatory" | "optional" | "hidden"
}

export function filterFormFields(fields: FormField[], visibility: string): FormField[] {
  return fields.filter((f) => f.visibility === visibility)
}

export function sortFormFields(fields: FormField[]): FormField[] {
  return [...fields].sort((a, b) => a.order - b.order)
}

export function validateFormData(
  data: Record<string, any>,
  fields: FormField[],
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  fields.forEach((field) => {
    if (field.required && !data[field.name]) {
      errors[field.name] = `${field.label} is required`
    }
  })

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
