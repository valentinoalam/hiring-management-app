import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resendVerificationEmail } from "../sign-up/action"
import { useSearchParams } from "next/navigation"

export default function SignUpSuccessPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Please check your email and click the confirmation link to verify your account. After confirming, you can
              log in to your account.
            </p>
            <Link href="/login" className="block">
              <Button className="w-full">Back to Login</Button>
            </Link>
            <Button onClick={() => resendVerificationEmail(email)} disabled={!email}>Resend the link</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
