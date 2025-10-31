import { auth } from "@/auth"
import { redirect } from "next/navigation"
export default async function Home() {
  const session = await auth()
  const user = session?.user

  if (user && user.role === "RECRUITER") {
    redirect("/recruiter")
  } else redirect("/job-seeker")
  
}
