"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Loader2 } from "lucide-react"
import { useUser } from "@/lib/auth/hooks"
import { useRecruiterJobs } from "@/lib/queries/jobs"
import { useUIStore } from "@/lib/store/ui-store"
import CreateJobModal from "@/components/recruiter/create-job-modal"

export default function JobsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { data: jobs = [], isLoading } = useRecruiterJobs(user?.id)

  const {
    jobSearchTerm,
    jobStatusFilter,
    jobSortBy,
    showCreateJobModal,
    setJobSearchTerm,
    setJobStatusFilter,
    setJobSortBy,
    setShowCreateJobModal,
  } = useUIStore()

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(jobSearchTerm.toLowerCase())
    const matchesStatus = jobStatusFilter === "all" || job.status === jobStatusFilter
    return matchesSearch && matchesStatus
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (jobSortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      draft: "destructive",
    }
    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return "Not specified"
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    return `Up to $${max?.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Listings</h1>
            <p className="text-muted-foreground mt-1">Manage your job postings and track applicants</p>
          </div>
          <Button onClick={() => setShowCreateJobModal(true)} className="gap-2" size="lg">
            <Plus className="w-4 h-4" />
            Create Job
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or department..."
                value={jobSearchTerm}
                onChange={(e) => setJobSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobSortBy} onValueChange={(v) => setJobSortBy(v as "newest" | "oldest")}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Jobs Table */}
        <Card>
          {isLoading ? (
            <div className="p-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-muted-foreground">Loading jobs...</span>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No jobs found</p>
              <Button onClick={() => setShowCreateJobModal(true)} variant="outline">
                Create your first job
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salary Range</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{formatSalary(job.salary_min, job.salary_max)}</TableCell>
                    <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/recruiter/jobs/${job.id}`)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        open={showCreateJobModal}
        onOpenChange={setShowCreateJobModal}
        onJobCreated={() => {
          setShowCreateJobModal(false)
        }}
      />
    </div>
  )
}
