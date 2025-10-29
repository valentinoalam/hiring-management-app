import { auth } from "@/auth"
import { redirect } from "next/navigation"
export default async function Home() {
  const session = await auth()
  const user = session?.user
  if (!user) {
    redirect("/auth/login")
  }

  if (user.role !== "RECRUITER") {
    redirect("/job-seeker")
  } else redirect("/recruiter")
  
}
