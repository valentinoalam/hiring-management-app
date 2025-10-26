"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/lib/auth/hooks"
import CandidateTable from "@/components/recruiter/candidate-table"
import { Loader2, ArrowLeft, Search } from "lucide-react"

interface Job {
  id: string
  title: string
}

interface Candidate {
  id: string
  full_name: string
  email: string
  phone: string
  gender: string
  linkedin: string
  domicile: string
  applied_at: string
  status: string
}

export default function CandidatesPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isRecruiter } = useUser()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (!isRecruiter) {
      router.push("/recruiter/dashboard")
      return
    }
    fetchJobAndCandidates()
  }, [isRecruiter, router])

  const fetchJobAndCandidates = async () => {
    try {
      setLoading(true)

      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("id", jobId)
        .eq("recruiter_id", user?.id)
        .single()

      if (jobError) throw jobError
      if (!jobData) {
        router.push("/recruiter/jobs")
        return
      }

      setJob(jobData)

      // Fetch candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("applications")
        .select(
          `
          id,
          status,
          applied_at,
          job_seeker_profiles:job_seeker_id (
            full_name,
            phone,
            location
          ),
          profiles:job_seeker_id (
            email
          )
        `,
        )
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false })

      if (candidatesError) throw candidatesError

      // Transform data
      const transformedCandidates = (candidatesData || []).map((app: any) => ({
        id: app.id,
        full_name: app.job_seeker_profiles?.full_name || "N/A",
        email: app.profiles?.email || "N/A",
        phone: app.job_seeker_profiles?.phone || "N/A",
        gender: "N/A",
        linkedin: "N/A",
        domicile: app.job_seeker_profiles?.location || "N/A",
        applied_at: app.applied_at,
        status: app.status,
      }))

      setCandidates(transformedCandidates)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/recruiter/jobs")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
            <p className="text-muted-foreground mt-1">{job?.title}</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Candidates Table */}
        <CandidateTable candidates={filteredCandidates} />
      </div>
    </div>
  )
}
