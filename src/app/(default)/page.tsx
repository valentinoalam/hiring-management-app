import { auth } from "@/auth"
import { redirect } from "next/navigation"
export default async function Home() {
  try {
    const session = await auth()
    const user = session?.user
    if (!user) {
      // If no user/session, redirect to the general jobs page (or a login page if that's your flow)
      redirect("/jobs")
    }
    if (user && user.role === "RECRUITER") {
      redirect("/recruiter")
    } else redirect("/jobs")
  } catch (error) {
    // Log the error to your server (Vercel logs)
    console.error("Error during authentication/redirection:", error) 
    
    // Ensure a user always lands somewhere if the auth check fails
    redirect("/jobs") 
  }
}
