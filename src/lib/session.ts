import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
 
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/itikaf/auth/login")
  }

  return session.user
}
