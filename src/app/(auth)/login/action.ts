"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { generateVerificationToken } from "@/lib/tokens"
import { sendMagicLinkEmail } from "@/lib/email"

export async function signInMagicLink(email: string, callbackUrl?: string) {
  try {
    // Generate verification token
    const verificationToken = await generateVerificationToken(email)
    
    // Send magic link email
    await sendMagicLinkEmail(email, verificationToken.token, callbackUrl)
    
    return { success: true }
  } catch (error) {
    console.error("Magic link sign in error:", error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: "Failed to send magic link. Please try again." }
  }
}

export async function signInCredentials(formData: FormData, callbackUrl?: string) {
  try {
    const result = await signIn("password", {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
      redirectTo: callbackUrl || "/",
    })
    
    if (result?.error) {
      return { success: false, error: result.error }
    }
    
    return { success: true, url: result?.url }
  } catch (error) {
    console.error("Sign in error:", error)
    
    if (error instanceof AuthError) {
      return { success: false, error: error.type || error.message }
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function signInOAuth(providerId: string, callbackUrl?: string) {
  try {
    await signIn(providerId, {
      redirectTo: callbackUrl || "/",
    })
  } catch (error) {
    console.error("OAuth sign in error:", error)
    throw error
  }
}