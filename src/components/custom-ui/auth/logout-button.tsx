"use client"

import { useLogout } from "@/lib/auth/hooks"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const logout = useLogout()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("[v0] Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant="outline">
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  )
}
