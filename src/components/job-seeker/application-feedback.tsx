"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"

interface ApplicationFeedbackProps {
  status: "success" | "error" | "validation-error"
  title?: string
  message: string
  errors?: Record<string, string>
}

export function ApplicationFeedback({ status, title, message, errors }: ApplicationFeedbackProps) {
  if (status === "success") {
    return (
      <Alert className="bg-green-50 border-green-200 mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">{title || "Success"}</AlertTitle>
        <AlertDescription className="text-green-800">{message}</AlertDescription>
      </Alert>
    )
  }

  if (status === "validation-error") {
    return (
      <Alert className="bg-amber-50 border-amber-200 mb-6" variant="destructive">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900">{title || "Validation Error"}</AlertTitle>
        <AlertDescription className="text-amber-800">
          <p className="mb-3">{message}</p>
          {errors && Object.keys(errors).length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-sm">
                  <strong>{field}:</strong> {error}
                </li>
              ))}
            </ul>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-red-50 border-red-200 mb-6" variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle className="text-red-900">{title || "Error"}</AlertTitle>
      <AlertDescription className="text-red-800">{message}</AlertDescription>
    </Alert>
  )
}
