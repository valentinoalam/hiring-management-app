"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApplicationFeedback } from "@/components/job/job-seeker/application-feedback"
import { Loader2, ArrowLeft } from "lucide-react"

interface Job {
  id: string
  title: string
  department: string
  description: string
}

interface FormField {
  id: string
  field_name: string
  field_type: string
  field_state: "mandatory" | "optional"
  display_order: number
}

interface FormData {
  [key: string]: string | File | null
}

interface SubmissionState {
  status: "idle" | "loading" | "success" | "error"
  message: string
  errors: Record<string, string>
}

export default function ApplyJobPage() {
  const params = useParams()
  const jobId = params.id as string
  const router = useRouter()
  const { data: session } = useSession()
  const isJobSeeker = session?.user?.role === "APPLICANT"
  const user = session?.user // Get the user object from the session

  const [job, setJob] = useState<Job | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [loading, setLoading] = useState(true)
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
    message: "",
    errors: {},
  })

    const fetchJobAndFormFields =  useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/jobs/${jobId}/application-data`, {
        method: "GET",
      })

      if (!response.ok) {
        // Handle the case where the job is not found or inactive (404/403)
        if (response.status === 404 || response.status === 403) {
          console.warn(`Job ${jobId} not found or inactive.`)
          router.push("/job-seeker/jobs")
          return
        }
        throw new Error(`API fetch failed with status: ${response.status}`)
      }

      const { jobData, fieldsData } = await response.json() // Server returns an object { jobData, fieldsData }

      if (!jobData) {
        router.push("/job-seeker/jobs")
        return
      }

      setJob(jobData)
      setFormFields(fieldsData || [])

      // Initialize form data (Client-side logic remains the same)
      const initialFormData: FormData = {}
      fieldsData?.forEach((field: { field_name: string }) => {
        initialFormData[field.field_name] = ""
      })
      setFormData(initialFormData)
    } catch (error) {
      console.error("Error fetching job and form fields:", error)
      // Fallback redirect in case of network error or other unhandled API issues
      router.push("/job-seeker/jobs") 
    } finally {
      setLoading(false)
    }
  }, [jobId, router])

  useEffect(() => {
    if (!isJobSeeker) {
      router.push("/job-seeker")
      return
    }
    fetchJobAndFormFields()
  }, [fetchJobAndFormFields, isJobSeeker, router])


  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    formFields.forEach((field) => {
      if (field.field_state === "mandatory") {
        const value = formData[field.field_name]
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors[field.field_name] = `${field.field_name} is required`
        }
      }
    })

    setSubmission((prev) => ({
      ...prev,
      errors,
    }))

    return Object.keys(errors).length === 0
  }

  // ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setSubmission((prev) => ({
        ...prev,
        status: "error",
        message: "Please fill in all required fields",
      }))
      return
    }
    
    // Ensure user is defined before proceeding to make a request
    if (!user?.id) {
      console.error("User ID is missing. Cannot submit application.");
      // Force sign-in or handle unauthenticated state
      return;
    }

    try {
      setSubmission((prev) => ({
        ...prev,
        status: "loading",
        message: "",
      }))

      // 2. ✅ Submit all application data (application record + responses) to a single API endpoint
      // The server-side API will handle the two database inserts (applications, application_responses) atomically.
      const submissionPayload = {
        jobId: jobId,
        jobSeekerId: user.id, // Passed explicitly, but the server should verify this against the token
        formResponses: formFields.map((field) => ({
          fieldName: field.field_name,
          fieldType: field.field_type,
          responseValue: formData[field.field_name] || "",
        })),
      }

      const response = await fetch(`/api/jobs/apply`, {
        method: "POST",
        body: JSON.stringify(submissionPayload),
      })

      if (!response.ok) {
        // The server API will return a 4xx or 5xx status on error
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process application on server.");
      }
      
      // Assuming the API returns the created application data (optional)
      // const applicationResult = await response.json();

      setSubmission({
        status: "success",
        message: "Your application has been submitted successfully!",
        errors: {},
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/job-seeker/jobs")
      }, 2000)

    } catch (error) {
      console.error("Error submitting application:", error)
      setSubmission({
        status: "error",
        message: (error as Error).message || "Failed to submit application. Please try again.",
        errors: {},
      })
    }
  }

  const handleInputChange = (fieldName: string, value: string | File | null) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
    // Clear error for this field
    setSubmission((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: "",
      },
    }))
  }

  const renderFormField = (field: FormField) => {
    const value = formData[field.field_name] || ""
    const error = submission.errors[field.field_name]
    const isRequired = field.field_state === "mandatory"

    const fieldLabel = (
      <Label htmlFor={field.field_name}>
        {field.field_name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
    )

    switch (field.field_type) {
      case "text":
      case "email":
      case "tel":
      case "url":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Input
              id={field.field_name}
              type={field.field_type}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
              placeholder={`Enter ${field.field_name.toLowerCase()}`}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Textarea
              id={field.field_name}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
              placeholder={`Enter ${field.field_name.toLowerCase()}`}
              rows={4}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Select
              value={typeof value === "string" ? value : ""}
              onValueChange={(val) => handleInputChange(field.field_name, val)}
            >
              <SelectTrigger className={error ? "border-destructive" : ""}>
                <SelectValue placeholder={`Select ${field.field_name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case "file":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Input
              id={field.field_name}
              type="file"
              onChange={(e) => handleInputChange(field.field_name, e.target.files?.[0] || null)}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/job-seeker/jobs")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Apply for Position</h1>
            <p className="text-muted-foreground mt-1">
              {job.title} at {job.department}
            </p>
          </div>
        </div>

        {submission.status === "success" && (
          <ApplicationFeedback status="success" title="Application Submitted" message={submission.message} />
        )}

        {submission.status === "error" && submission.message && (
          <ApplicationFeedback status="error" title="Submission Failed" message={submission.message} />
        )}

        {submission.status === "error" && Object.keys(submission.errors).length > 0 && (
          <ApplicationFeedback
            status="validation-error"
            title="Missing Required Fields"
            message="Please fill in all required fields marked with an asterisk (*)"
            errors={submission.errors}
          />
        )}

        {/* Job Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">{job.title}</h2>
          <p className="text-muted-foreground">{job.description}</p>
        </Card>

        {/* Application Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Application Form</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formFields.length === 0 ? (
              <p className="text-muted-foreground">No form fields configured for this job.</p>
            ) : (
              formFields.map((field) => renderFormField(field))
            )}

            {/* Submit Button */}
            <div className="flex gap-2 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/job-seeker/jobs")}
                disabled={submission.status === "loading"}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submission.status === "loading"} className="flex-1">
                {submission.status === "loading" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
