import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/auth/logout-button"

export default async function RecruiterDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Verify user is a recruiter
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "recruiter") {
    redirect("/job-seeker/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <LogoutButton />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600">Welcome, {user.email}</p>
          <p className="text-sm text-slate-500 mt-2">Role: Recruiter</p>
        </div>
      </div>
    </div>
  )
}
