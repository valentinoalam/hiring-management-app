import { ProtectedRoute } from "@/components/layout/protected-route"
import type React from "react"
export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}
