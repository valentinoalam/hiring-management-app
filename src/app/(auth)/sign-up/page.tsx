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
import { signInOAuth, signUpCredentials } from "./action"
import { useSearchParams } from 'next/navigation';
import Link from "next/link"
import Logo from "@/components/layout/logo"
import { Separator } from "@/components/ui/separator"
import { Mail,  CheckCircle2 } from "lucide-react"

const signUpSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string()
    .min(6, {
      message: "Password must be at least 6 characters.",
    })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const providerMap = [
  { id: "google", name: "Google" },
]

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get('callbackUrl') || undefined;
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    setIsLoading(true)
    setError("")
    
    try {
      const formData = new FormData()
      formData.append('fullName', values.fullName)
      formData.append('email', values.email)
      formData.append('password', values.password)
      
      const result = await signUpCredentials(formData, callbackURL)
      
      if (result?.error) {
        // Handle specific server-side error codes
        switch (result.error) {
          case 'EMAIL_ALREADY_EXISTS':
            setError("Email already exists. Please use a different email or sign in.")
            break
          case 'WEAK_PASSWORD':
            setError("Password is too weak. Please use a stronger password.")
            break
          case 'INVALID_EMAIL':
            setError("Please enter a valid email address.")
            break
          default:
            setError("Failed to create account. Please try again.")
            break
        }
      } else if (result?.success) {
        // Trigger success animation
        setShowAnimation(true)
        setTimeout(() => {
          setSuccess(true)
          setShowAnimation(false)
        }, 600)
      }
    } catch (err) {
      console.error("Sign up error:", err)
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
      setError("An error occurred with OAuth sign up. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/login" + (callbackURL ? `?callbackUrl=${encodeURIComponent(callbackURL)}` : ""))
  }

  return (
    <div className="min-h-screen bg-neutral-10 flex items-center justify-center px-4">
      <div className="max-w-md w-full gap-6">
        <Logo withName={false} />
        
        {/* Success Card */}
        {success ? (
          <div className={`
            transform transition-all duration-500 ease-out
            ${showAnimation ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}>
            <Card className="min-h-[400px] w-[500px] border-neutral-40 bg-neutral-10 *:px-11">
              <CardHeader className="p-0 pt-8 text-center">
                <div className="mx-auto mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-ping">
                        <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <CardTitle className="font-bold text-2xl text-neutral-100 mb-3">
                  Pendaftaran Berhasil!
                </CardTitle>
                <CardDescription className="text-neutral-90 text-base">
                  Akun Anda telah berhasil dibuat
                </CardDescription>
                <CardDescription className="text-neutral-90 text-sm mt-2">
                  Silakan periksa email Anda untuk verifikasi akun
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0 mt-8">
                <div className="text-center space-y-6">
                  <div className="bg-neutral-20 rounded-xl p-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex items-center space-x-2 text-neutral-80">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <span className="text-sm">Buka email Anda</span>
                      </div>
                      <div className="flex items-center space-x-2 text-neutral-80">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-sm">Cari email verifikasi dari Rakamin</span>
                      </div>
                      <div className="flex items-center space-x-2 text-neutral-80">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        <span className="text-sm">Klik link untuk verifikasi akun</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex-col gap-4 mt-8">
                <Button
                  onClick={handleBackToLogin}
                  variant="secondary"
                  className="w-full rounded-xl font-bold bg-neutral-90 text-neutral-10 hover:bg-neutral-100"
                >
                  Masuk ke Akun
                </Button>
                
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full rounded-xl font-bold border-neutral-40 text-neutral-100 hover:bg-neutral-20"
                >
                  Daftar Akun Baru
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          /* Sign Up Form Card */
          <div className={`
            transform transition-all duration-500 ease-out
            ${showAnimation ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}>
            <Card className="min-h-[550px] w-[500px] border-neutral-40 bg-neutral-10 *:px-11">
              <CardHeader className="p-0 pt-6">
                <CardTitle className="font-bold text-xl text-neutral-100">Bergabung dengan Rakamin</CardTitle>
                <CardDescription className="text-neutral-90">
                  Sudah punya akun? <Link href="/login" className="text-primary">Masuk</Link>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <AlertDescription className="text-neutral-10">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Sign Up Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-100">Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              className="rounded-xl border-neutral-40 border-2 placeholder:text-neutral-80 text-neutral-100 focus:border-blue-500 transition-colors"
                              placeholder="Enter your full name"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-neutral-70" />
                        </FormItem>
                      )}
                    /> */}

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-90 text-s">Alamat email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              className="rounded-xl border-neutral-40 hover:border-primary border-2 placeholder:text-neutral-80 text-neutral-100 focus:border-blue-500 transition-colors"
                              placeholder="Enter your email"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-neutral-70" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-100">Kata Sandi</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              className="rounded-xl border-neutral-40 hover:border-primary border-2 placeholder:text-neutral-80 text-neutral-100 focus:border-blue-500 transition-colors"
                              placeholder="Create a password"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-neutral-70" />
                        </FormItem>
                      )}
                    />

                    {/* <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-100">Konfirmasi Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              className="rounded-xl border-neutral-40 border-2 placeholder:text-neutral-80 text-neutral-100 focus:border-blue-500 transition-colors"
                              placeholder="Confirm your password"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-neutral-70" />
                        </FormItem>
                      )}
                    /> */}

                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isLoading}
                      className="w-full rounded-xl font-bold bg-secondary text-neutral-90 hover:bg-neutral-100 transition-all duration-200 hover:scale-105 active:scale-95 mt-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Mendaftarkan...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2" />
                          Daftar dengan Email
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="flex-col gap-6">
                {/* Separator */}
                <div className="space-y-3 w-full *:font-bold">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="border-neutral-40 bg-neutral-40" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <div className="w-6 h-6 rounded-full bg-neutral-10 content-evenly text-center">
                        <span className="text-neutral-80">Or</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OAuth Providers */}
                <div className="space-y-3 w-full *:font-bold">
                  {providerMap.map((provider) => (
                    <Button
                      key={provider.id}
                      onClick={() => handleProviderSignIn(provider.id)}
                      disabled={isLoading}
                      type="button"
                      variant="outline"
                      className="w-full flex items-center gap-3 bg-neutral-10 border border-neutral-40 rounded-lg px-6 py-3 text-neutral-100 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 ease-in-out"
                    >
                      {provider.name === "Google" && 
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      }
                      Daftar dengan {provider.name}
                    </Button>
                  ))}
                </div>

                {/* Terms and Conditions */}
                <div className="text-center">
                  <p className="text-xs text-neutral-70">
                    Dengan mendaftar, Anda menyetujui{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Syarat & Ketentuan
                    </Link>{' '}
                    dan{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Kebijakan Privasi
                    </Link>{' '}
                    kami
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}