"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInCredentials, signInOAuth, signInMagicLink } from "./action"
import { useSearchParams } from 'next/navigation';
import Link from "next/link"
import Logo from "@/components/layout/logo"
import { Separator } from "@/components/ui/separator"
import { KeyRound, Mail, Lock } from "lucide-react"
import LinkSentSuccess from "./link-send-notif"

const emailSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
})

const passwordSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

const providerMap = [
  { id: "google", name: "Google" },
]

type AuthMethod = "magic-link" | "password"

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get('callbackUrl') || undefined;
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeMethod, setActiveMethod] = useState<AuthMethod>("magic-link")
  const [error, setError] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [email, setEmail] = useState("")
  const [showAnimation, setShowAnimation] = useState(false)

  const magicLinkForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmitMagicLink(values: z.infer<typeof emailSchema>) {
    setIsLoading(true)
    setError("")
    setEmail(values.email)
    
    try {
      const result = await signInMagicLink(values.email, callbackURL)
      
      if (result?.error) {
        setError("Failed to send magic link. Please try again.")
      } else if (result?.success) {
        // Trigger animation
        setShowAnimation(true)
        setTimeout(() => {
          setMagicLinkSent(true)
          setShowAnimation(false)
        }, 600) // Match animation duration
      }
    } catch (err) {
      console.error("Magic link error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmitPassword(values: z.infer<typeof passwordSchema>) {
    setIsLoading(true)
    setError("")
    
    try {
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      
      const result = await signInCredentials(formData, callbackURL)
      
      if (result?.error) {
        switch (result.error) {
          case 'EMAIL_NOT_VERIFIED':
            setError("Your email is not verified. Please check your inbox for the verification link.")
            break
          case 'OAUTH_ONLY_ACCOUNT':
            setError("This account was created via Google. Please sign in with Google.")
            break
          case 'INVALID_CREDENTIALS':
          case 'CredentialsSignin':
          default:
            setError("Invalid email or password. Please try again.")
            break
        }
      } else if (result?.success) {
        router.push(callbackURL ?? "/")
        router.refresh()
      }
    } catch (err) {
      console.error("Sign in error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleProviderSignIn(providerId: string) {
    setIsLoading(true)
    setError("")
    
    try {
      await signInOAuth(providerId, callbackURL)
    } catch (err) {
      console.error("OAuth error:", err)
      setError("An error occurred with OAuth sign in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const switchToPassword = () => {
    setActiveMethod("password")
    // Pre-fill the email in password form if available
    if (email) {
      passwordForm.setValue("email", email)
    }
  }

  const switchToMagicLink = () => {
    setActiveMethod("magic-link")
    setMagicLinkSent(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-auto">
      <div className="max-w-md w-full mx-auto">
        <Logo withName={false} />
        {/* Magic Link Sent Success Card */}
        {magicLinkSent ? (
          <div className={`
            transform transition-all duration-500 ease-out
            ${showAnimation ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}> <LinkSentSuccess email={email} />
          </div>
        ) : 
          <Card className="max-h-[444px] md:w-[500px] border-none *:px-11 overflow-y-scroll">
            <CardHeader className="p-0 pt-6">
              <CardTitle className="font-bold text-xl">Masuk ke Rakamin</CardTitle>
              <CardDescription className="text-neutral-100">Belum punya akun? <Link href="/sign-up" className="text-primary">Daftar menggunakan email</Link></CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {magicLinkSent && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertDescription className="text-green-800">
                    Link telah dikirim! Silakan periksa email Anda untuk link masuk.
                  </AlertDescription>
                </Alert>
              )}

              {/* Magic Link Form (Always visible initially) */}
              <Form {...magicLinkForm}>
                <form onSubmit={magicLinkForm.handleSubmit(onSubmitMagicLink)} className="space-y-6">
                  <FormField
                    control={magicLinkForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-90 text-s">Alamat email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className="rounded-xl  border-neutral-40 hover:border-primary border-2 placeholder:text-gray-500"
                            placeholder="Enter your email"
                            disabled={isLoading || activeMethod === "password"}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              setEmail(e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {activeMethod === "magic-link" && (
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isLoading}
                      className="w-full rounded-xl font-bold"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2" />
                          Kirim link
                        </>
                      )}
                    </Button>
                  )}
                </form>
              </Form>

              {/* Password Form (Only visible when switched) */}
              {activeMethod === "password" && (
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6 mt-6">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              disabled={isLoading}
                              className="rounded-xl border-primary border-2 placeholder:text-gray-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={switchToMagicLink}
                        disabled={isLoading}
                        className="flex-1 rounded-xl"
                      >
                        Kembali
                      </Button>
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={isLoading}
                        className="flex-1 rounded-xl font-bold"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Masuk...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 mr-2" />
                            Masuk dengan Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
            
            <CardFooter className="flex-col gap-6">
              {/* Separator and Password Option */}
              {activeMethod === "magic-link" && (
                <div className="space-y-6 w-full *:font-bold">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="border-gray-500 bg-gray-500" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <div className="w-6 h-6 rounded-full bg-white content-evenly text-center">
                        <span className="text-gray-500">Or</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Password Login Option */}
                  <Button
                    onClick={switchToPassword}
                    disabled={isLoading || !email}
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out"
                  >
                    <KeyRound className="w-5 h-5" />
                    Masuk dengan Password
                  </Button>
                </div>
              )}

              {/* OAuth Providers */}
              <div className="space-y-3 w-full *:font-bold">
                {providerMap.map((provider) => (
                  <Button
                    key={provider.id}
                    onClick={() => handleProviderSignIn(provider.id)}
                    disabled={isLoading}
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out"
                  >
                    {provider.name === "Google" && 
                      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    }
                    Masuk dengan {provider.name}
                  </Button>
                ))}
              </div>
            </CardFooter>
          </Card>
        }
      </div>
    </div>
  )
}