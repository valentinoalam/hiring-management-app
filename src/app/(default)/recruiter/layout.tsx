'use client'
import { ProtectedRoute } from "@/components/layout/protected-route.js"
import { useAuthStore } from "@/stores/auth-store.js";
import { useRouter } from "next/navigation";
import type React from "react"
export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  
  if (userRole && userRole !== 'RECRUITER') {
    return router.push('/jobs');
  }
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}
