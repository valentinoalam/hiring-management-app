"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
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
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInCredentials, signInOAuth, signInMagicLink } from "./action"
import { useSearchParams } from 'next/navigation'
import Link from "next/link"
import Logo from "@/components/layout/logo"
import { Separator } from "@/components/ui/separator"
import { KeyRound, Mail, Lock, Edit } from "lucide-react"
import LinkSentSuccess from "@/components/layout/link-sent"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { useSession } from "next-auth/react"
import Loading from "@/components/layout/loading"

// Separate schemas for different auth methods
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
] as const

type AuthMethod = "magic-link" | "password"
type ProviderId = typeof providerMap[number]['id']

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const router = useRouter()
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false)
  const [activeMethod, setActiveMethod] = useState<AuthMethod>("magic-link")
  const [error, setError] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  // Separate forms for each auth method
  const magicLinkForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
    mode: "onChange",
    reValidateMode: "onChange"
  })
  const isMagicLinkFormValid = magicLinkForm.formState.isValid && !magicLinkForm.formState.errors.email
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  })

  const magicLinkEmail = magicLinkForm.watch("email")
  const passwordEmail = passwordForm.watch("email")
  const currentEmail = activeMethod === "magic-link" ? magicLinkEmail : passwordEmail

  useEffect(() => {
    if (session) {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      router.push(callbackUrl);
    }
  }, [session, router, searchParams]);
  if (session) {
    return null; // Return null while redirecting
  }
  // Reset errors when user interacts with forms
  const clearError = () => setError("")
  if (status === 'loading') {
    return <Loading />
  }

  async function handleMagicLinkSubmit(values: z.infer<typeof emailSchema>) {
    setIsLoading(true)
    setError("")
    try {
      const result = await signInMagicLink(values.email, callbackUrl || undefined)
      
      if (result?.error) {
        setError("Failed to send magic link. Please try again.")
      } else if (result?.success) {
        setShowAnimation(true)
        setTimeout(() => {
          setMagicLinkSent(true)
          setShowAnimation(false)
        }, 600)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } catch (err) {
      console.error("Magic link error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setIsLoading(true)
    setError("")
    
    try {
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      
      const result = await signInCredentials(formData, callbackUrl)
      
      if (!result?.success || result?.error) {
        switch (result.error) {
          case 'EMAIL_NOT_VERIFIED':
            setError("Your email is not verified. Please check your inbox for the verification link.")
            break
          case 'OAUTH_ONLY_ACCOUNT':
            setError("This account was created via Google. Please sign in with Google.")
            break
          case 'INVALID_CREDENTIALS':
          case 'CredentialsSignin':
            setError("Invalid email or password. Please try again.")
            break
          default:
            setError("An unexpected error occurred. Please try again.")
            break
        }
      } else if (result?.success && result.redirectTo) {
        router.push(result.redirectTo);
      }
    } catch (err) {
      console.error("Sign in error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleProviderSignIn(providerId: ProviderId) {
    setIsLoading(true)
    setError("")
    
    try {
      await signInOAuth(providerId, callbackUrl || undefined)
      // Note: This will redirect, so code after won't execute
    } catch (err: unknown) {
      // Only handle actual errors, not redirects
      const error = err as { url?: string; cause?: { url?: string } }
      if (!error?.url && !error?.cause?.url) {
        console.error("OAuth error:", err)
        setError("An error occurred with OAuth sign in. Please try again.")
        setIsLoading(false)
      }
      // If it's a redirect error, let it propagate
    }
  }

  const switchToPassword = () => {
    if (magicLinkEmail) {
      passwordForm.setValue("email", magicLinkEmail)
    }
    setActiveMethod("password")
    clearError()
  }

  const switchToMagicLink = () => {
    setActiveMethod("magic-link")
    setMagicLinkSent(false)
    clearError()
  }

  const handleEditEmail = () => {
    setActiveMethod("magic-link")
    clearError()
  }

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-left mb-8">
          <Logo withName={false} />
        </div>
        
        {/* Magic Link Sent Success Card */}
        {magicLinkSent ? (
          <div className={`
            transform transition-all duration-500 ease-out
            ${showAnimation ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}> 
            <LinkSentSuccess email={currentEmail} />
          </div>
        ) : (
          <Card className="max-h-[444px] md:w-[500px] border-none *:px-11 overflow-y-scroll no-scrollbar">
            <CardHeader className="p-0 pt-6">
              <CardTitle className="font-bold text-xl">Masuk ke Rakamin</CardTitle>
              <CardDescription className="text-neutral-100">
                Belum punya akun?{" "}
                <Link 
                  href={{
                    pathname: '/sign-up',
                    query: callbackUrl ? { callbackUrl } : {}
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Daftar menggunakan email
                </Link>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0 pb-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription className="flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </AlertDescription>
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
              {/* Magic Link Form */}
              {activeMethod === "magic-link" && (
                <form onSubmit={magicLinkForm.handleSubmit(handleMagicLinkSubmit)} className="space-y-4">
                  <FieldGroup>
                    <Controller
                      name="email"
                      control={magicLinkForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="text-gray-700 text-sm font-medium">
                            Alamat email
                          </FieldLabel>
                          <Input
                            type="email"
                            className="rounded-lg border-gray-300 hover:border-primary focus:border-primary transition-colors"
                            placeholder="Enter your email"
                            disabled={isLoading}
                            {...field}
                            // onChange={(e) => {
                            //   field.onChange(e)
                            //   clearError()
                            // }}
                          />
                          {fieldState.invalid && fieldState.error?.message && (
                            <FieldError errors={[{ message: fieldState.error.message }]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={isLoading || !magicLinkEmail || !isMagicLinkFormValid}
                    className="w-full rounded-lg font-bold"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Kirim link
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Password Form */}
              {activeMethod === "password" && (
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  {/* Email Display */}
                  <FieldGroup>
                    <Field>
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel className="text-gray-700 text-sm font-medium">
                          Alamat email
                        </FieldLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleEditEmail}
                          className="h-auto p-0 text-primary hover:text-primary/80 text-xs font-medium"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Ubah
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
                        <Mail className="w-4 h-4 text-neutral-60" />
                        <span className="flex-1">{passwordEmail}</span>
                      </div>
                    </Field>
                  </FieldGroup>

                  {/* Password Field */}
                  <FieldGroup>
                    <Controller
                      name="password"
                      control={passwordForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="text-gray-700 text-sm font-medium">
                            Password
                          </FieldLabel>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            disabled={isLoading}
                            className="rounded-lg border-gray-300 hover:border-primary focus:border-primary transition-colors"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              clearError()
                            }}
                          />
                          {fieldState.invalid && fieldState.error?.message && (
                            <FieldError errors={[{ message: fieldState.error.message }]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={switchToMagicLink}
                      disabled={isLoading}
                      className="flex-1 rounded-lg h-11"
                    >
                      Kembali
                    </Button>
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isLoading || !passwordForm.formState.isValid}
                      className="flex-1 rounded-lg font-semibold h-11"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner />
                          <span>Masuk...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Masuk
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
            
            <CardFooter className="flex-col gap-6">
              {/* Separator and Password Option */}
              {activeMethod === "magic-link" && !magicLinkForm.formState.errors.email && (
                <div className="space-y-6 w-full *:font-bold">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="border-neutral-60 bg-neutral-60" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <div className="w-6 h-6 rounded-full bg-white content-evenly text-center">
                        <span className="text-neutral-60">Or</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={switchToPassword}
                    disabled={isLoading}
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <KeyRound className="w-5 h-5" />
                    Masuk dengan Password
                  </Button>
                </div>
              )}
              
              {/* OAuth Providers */}
              <div className="space-y-3 w-full *:font-bold">
                {activeMethod === "password" && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="border-neutral-60 bg-neutral-60" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <div className="w-6 h-6 rounded-full bg-white content-evenly text-center">
                        <span className="text-neutral-60">Or</span>
                      </div>
                    </div>
                  </div>
                )}
                {providerMap.map((provider) => (
                  <Button
                    key={provider.id}
                    onClick={() => handleProviderSignIn(provider.id)}
                    disabled={isLoading}
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {provider.name === "Google" && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    Masuk dengan {provider.name}
                  </Button>
                ))}
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}