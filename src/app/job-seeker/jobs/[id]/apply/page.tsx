"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApplicationFeedback } from "@/components/job-seeker/application-feedback"
import { useUser } from "@/lib/auth/hooks"
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
  const router = useRouter()
  const { user, isJobSeeker } = useUser()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [loading, setLoading] = useState(true)
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
    message: "",
    errors: {},
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (!isJobSeeker) {
      router.push("/job-seeker/dashboard")
      return
    }
    fetchJobAndFormFields()
  }, [isJobSeeker, router])

  const fetchJobAndFormFields = async () => {
    try {
      setLoading(true)

      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("status", "active")
        .single()

      if (jobError) throw jobError
      if (!jobData) {
        router.push("/job-seeker/jobs")
        return
      }

      setJob(jobData)

      // Fetch form fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from("application_form_fields")
        .select("*")
        .eq("job_id", jobId)
        .order("display_order", { ascending: true })

      if (fieldsError) throw fieldsError
      setFormFields(fieldsData || [])

      // Initialize form data
      const initialFormData: FormData = {}
      fieldsData?.forEach((field) => {
        initialFormData[field.field_name] = ""
      })
      setFormData(initialFormData)
    } catch (error) {
      console.error("Error fetching job and form fields:", error)
      router.push("/job-seeker/jobs")
    } finally {
      setLoading(false)
    }
  }

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

    try {
      setSubmission((prev) => ({
        ...prev,
        status: "loading",
        message: "",
      }))

      // Create application record
      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          job_seeker_id: user?.id,
          status: "pending",
          applied_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (applicationError) throw applicationError

      // Store form responses
      const responses = formFields.map((field) => ({
        application_id: applicationData.id,
        field_name: field.field_name,
        field_type: field.field_type,
        response_value: formData[field.field_name] || "",
      }))

      const { error: responsesError } = await supabase.from("application_responses").insert(responses)

      if (responsesError) throw responsesError

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
        message: "Failed to submit application. Please try again.",
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
