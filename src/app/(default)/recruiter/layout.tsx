'use client'
import { ProtectedRoute } from "@/components/layout/protected-route"
import { useAuthStore } from "@/stores/auth-store";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react"
export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  // --- Role Check and Redirect ---
  if (user === undefined || user === null) {
      return null;
  }
  const userRole = user?.role;
  
  if (userRole !== 'RECRUITER') { // Assuming 'RECRUITER' is the role type
    router.push('/login?callbackUrl=/recruiter');
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 text-center text-red-500">
        <X className="h-10 w-10 mb-4" />
        <p className="text-xl font-bold">Access Denied</p>
        <p className="mt-2">You must be logged in as a Recruiter to view this page.</p>
      </div>
    );
  }
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}
