"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, DollarSign, Briefcase, Search, Loader2 } from "lucide-react"
import { useActiveJobs } from "@/hooks/queries/job-queries"
import { useUIStore } from "@/stores/ui-store"
import { salaryDisplay } from "@/utils/formatters/salaryFormatter"

export default function JobListPage() {
  const router = useRouter()
  const { data: jobs = [], isLoading } = useActiveJobs()

  const {
    jobSearchTerm,
    jobDepartmentFilter,
    jobEmploymentTypeFilter,
    setJobSearchTerm,
    setJobDepartmentFilter,
    setJobEmploymentTypeFilter,
  } = useUIStore()

  const departments = [...new Set(jobs.map((job) => job.department))]

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
      (job.description || '').toLowerCase().includes(jobSearchTerm.toLowerCase())
    const matchesDepartment = jobDepartmentFilter === "all" || job.department === jobDepartmentFilter
    const matchesEmploymentType = jobEmploymentTypeFilter === "all" || job.employmentType === jobEmploymentTypeFilter
    return matchesSearch && matchesDepartment && matchesEmploymentType
  })

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Job Opportunities</h1>
          <p className="text-muted-foreground mt-1">Find and apply to positions that match your skills</p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title or keywords..."
                value={jobSearchTerm}
                onChange={(e) => setJobSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={jobDepartmentFilter} onValueChange={setJobDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept || 'unknown'} value={dept || 'unknown'}>
                    {dept || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobEmploymentTypeFilter} onValueChange={setJobEmploymentTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No jobs found matching your criteria</p>
            <Button variant="outline" onClick={() => setJobSearchTerm("")}>
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="space-y-4">
                  {/* Job Title and Department */}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.department}</p>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>{salaryDisplay(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.employmentType}</span>
                    </div>
                  </div>

                  {/* Description Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                  {/* Apply Button */}
                  <Button className="w-full mt-4" onClick={() => router.push(`/job-seeker/jobs/${job.id}/apply`)}>
                    View & Apply
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
