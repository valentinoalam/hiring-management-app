import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800">
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold text-white mb-4">HireFlow</h1>
          <p className="text-xl text-slate-300 mb-8">
            A modern hiring platform connecting recruiters and job seekers with dynamic, job-specific application forms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" variant="default">
                Login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="outline">
                Sign Up
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">For Recruiters</h3>
              <p className="text-slate-400">
                Create jobs, customize application forms, and manage candidates efficiently.
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">For Job Seekers</h3>
              <p className="text-slate-400">
                Find opportunities and apply with personalized, flexible application forms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
