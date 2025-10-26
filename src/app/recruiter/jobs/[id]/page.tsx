"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/auth/hooks"
import FormFieldBuilder from "@/components/recruiter/form-field-builder"
import { Loader2, ArrowLeft } from "lucide-react"

interface Job {
  id: string
  title: string
  description: string
  department: string
  location: string
  salary_min: number | null
  salary_max: number | null
  employment_type: string
  status: "draft" | "active" | "inactive"
  created_at: string
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isRecruiter } = useUser()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    location: "",
    salary_min: "",
    salary_max: "",
    employment_type: "Full-time",
    status: "draft" as const,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (!isRecruiter) {
      router.push("/recruiter/dashboard")
      return
    }
    fetchJob()
  }, [isRecruiter, router])

  const fetchJob = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("recruiter_id", user?.id)
        .single()

      if (error) throw error
      if (!data) {
        router.push("/recruiter/jobs")
        return
      }

      setJob(data)
      setFormData({
        title: data.title,
        description: data.description || "",
        department: data.department,
        location: data.location || "",
        salary_min: data.salary_min?.toString() || "",
        salary_max: data.salary_max?.toString() || "",
        employment_type: data.employment_type,
        status: data.status,
      })
    } catch (error) {
      console.error("Error fetching job:", error)
      router.push("/recruiter/jobs")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = async () => {
    if (!job) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("jobs")
        .update({
          title: formData.title,
          description: formData.description,
          department: formData.department,
          location: formData.location,
          salary_min: formData.salary_min ? Number.parseFloat(formData.salary_min) : null,
          salary_max: formData.salary_max ? Number.parseFloat(formData.salary_max) : null,
          employment_type: formData.employment_type,
          status: formData.status,
        })
        .eq("id", job.id)

      if (error) throw error
      setJob({ ...job, ...formData })
    } catch (error) {
      console.error("Error saving job:", error)
    } finally {
      setSaving(false)
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/recruiter/jobs")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
            <p className="text-muted-foreground mt-1">Configure job details and application form</p>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Job Details</TabsTrigger>
            <TabsTrigger value="form">Application Form</TabsTrigger>
          </TabsList>

          {/* Job Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="employment_type">Employment Type</Label>
                    <Select
                      value={formData.employment_type}
                      onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                    >
                      <SelectTrigger id="employment_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salary_min">Minimum Salary</Label>
                    <Input
                      id="salary_min"
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary_max">Maximum Salary</Label>
                    <Input
                      id="salary_max"
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as "draft" | "active" | "inactive" })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => fetchJob()}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveJob} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Application Form Tab */}
          <TabsContent value="form">
            <FormFieldBuilder jobId={job.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
