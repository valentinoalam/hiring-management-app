"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface FormField {
  id: string
  jobId: string
  fieldName: string
  fieldType: string
  fieldState: "mandatory" | "optional" | "off"
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export function useJobFormFields(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job-form-fields", jobId],
    queryFn: async () => {
      if (!jobId) return []
      const response = await fetch(`/api/form-fields?jobId=${jobId}`)
      if (!response.ok) throw new Error("Failed to fetch form fields")
      return response.json() as Promise<FormField[]>
    },
    enabled: !!jobId,
  })
}

export function useCreateFormField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fieldData: Omit<FormField, "id" | "createdAt" | "updatedAt">) => {
      const response = await fetch("/api/form-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldData),
      })
      if (!response.ok) throw new Error("Failed to create form field")
      return response.json() as Promise<FormField>
    },
    onSuccess: (newField) => {
      queryClient.invalidateQueries({ queryKey: ["job-form-fields", newField.jobId] })
    },
  })
}

export function useUpdateFormField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...fieldData }: Partial<FormField> & { id: string }) => {
      const response = await fetch(`/api/form-fields/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldData),
      })
      if (!response.ok) throw new Error("Failed to update form field")
      return response.json() as Promise<FormField>
    },
    onSuccess: (updatedField) => {
      queryClient.invalidateQueries({ queryKey: ["job-form-fields", updatedField.jobId] })
    },
  })
}

export function useDeleteFormField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fieldId: string) => {
      const response = await fetch(`/api/form-fields/${fieldId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete form field")
      return fieldId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-form-fields"] })
    },
  })
}
