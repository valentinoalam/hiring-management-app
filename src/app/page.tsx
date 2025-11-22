import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  const user = session?.user
  
  if (!session || !user) {
    return redirect("/jobs")
  }
  
  if (user.role === "RECRUITER") {
    return redirect("/recruiter")
  }
  
  return redirect("/jobs")

}