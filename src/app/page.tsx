import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  try {
    const session = await auth()
    const user = session?.user
    
    if (!user) {
      redirect("/jobs")
    }
    
    if (user.role === "RECRUITER") {
      redirect("/recruiter")
    }
    
    redirect("/jobs")
    
  } catch (error) {
    console.error("Error during authentication/redirection:", error)
    redirect("/jobs")
  }
}