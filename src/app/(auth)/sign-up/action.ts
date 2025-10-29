"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateVerificationToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/email"

export async function signUpCredentials(formData: FormData, callbackUrl?: string) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { success: false, error: 'EMAIL_ALREADY_EXISTS' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'APPLICANT', // Default role
      },
    })

    // Generate verification token and send email
    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(email, verificationToken.token)

    // Optionally sign in the user immediately after registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: callbackUrl || "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Sign up error:", error)
    
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