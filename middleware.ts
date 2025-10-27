import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
export { auth as middleware } from "@/auth"

// --- 1. Define Protected Routes for Role Checking ---
const ADMIN_ROUTES = ["/admin", "/admin/users", "/admin/settings"]
const RECRUITER_ROUTES = ["/post-job", "/my-jobs"]

// --- 2. Authorization and Redirection Logic ---
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // Skip middleware for public routes
  if (path.startsWith('/api/auth') || path.startsWith('/login') || path.startsWith('/register')) {
    return NextResponse.next()
  }
  
  try {
    const session = await auth()
    
    // If no session, redirect to login
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const userRole = session.user.role

    // --- Role-Based Authorization Checks ---

    // 1. Check Admin Routes
    if (ADMIN_ROUTES.some(route => path.startsWith(route))) {
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // 2. Check Recruiter/Job Poster Routes
    if (RECRUITER_ROUTES.some(route => path.startsWith(route))) {
      if (userRole !== 'RECRUITER' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    
    return NextResponse.next()
  } catch {
    // If session check fails, redirect to login
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

// --- 3. Matcher Configuration ---
export const config = {
    // Apply the middleware to all paths EXCEPT the following:
    matcher: [
        /*
         * Match all paths except those starting with:
         * - /api/auth (NextAuth API routes)
         * - _next/static, _next/image (Next.js internals)
         * - favicon.ico, /login, /register, /auth/verify-request (Public pages)
         * - /public, /assets (Custom static directories)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|auth/verify-request|public|assets).*)",
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ],
};