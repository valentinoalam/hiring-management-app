"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation.js"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useSession();
  const pathname = usePathname()
  const router = useRouter()

  if (status ===  "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push(`/login?callbackUrl=${pathname}`)
    return null
  }
  return <>{children}</>
}

