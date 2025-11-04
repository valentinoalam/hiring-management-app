import { redirect } from "next/navigation"
import { signOut} from "@/auth"
export async function GET() {
  await signOut()
  redirect("/")
}
