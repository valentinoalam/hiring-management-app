import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
  const isRecruiterPage = request.nextUrl.pathname.startsWith("/recruiter")
  const isJobSeekerPage = request.nextUrl.pathname.startsWith("/job-seeker")
  const isPublicPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/jobs")

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    // Get user role from metadata or default to job_seeker
    const role = user.user_metadata?.role || "job_seeker"
    url.pathname = role === "recruiter" ? "/recruiter/dashboard" : "/job-seeker/dashboard"
    return NextResponse.redirect(url)
  }

  // If user is not logged in and tries to access protected pages, redirect to login
  if (!user && (isRecruiterPage || isJobSeekerPage)) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
