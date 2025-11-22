"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateVerificationToken } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/email"

export async function signUpCredentials(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    // Validate required fields
    if (!email || !password || !name) {
      return { success: false, error: 'MISSING_REQUIRED_FIELDS' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: 'INVALID_EMAIL_FORMAT' }
    }

    // Validate password strength
    if (password.length < 6) {
      return { success: false, error: 'PASSWORD_TOO_SHORT' }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Check if user has a password (credentials account)
      if (existingUser.password) {
        return { success: false, error: 'EMAIL_ALREADY_EXISTS' }
      } else {
        // User exists but uses OAuth - suggest they use OAuth login
        return { success: false, error: 'OAUTH_ACCOUNT_EXISTS' }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: name.trim(),
          role: 'APPLICANT', // Default role
        },
      })

      // Create profile for the user
      await tx.profile.create({
        data: {
          userId: user.id,
          fullname: name.trim(),
        },
      })

      return user
    })

    // Generate verification token and send email
    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(email, verificationToken.token)

    // Don't sign in automatically - require email verification first
    // Instead, return success and let the client handle redirect to verification page
    return { success: true, url: result, redirectUrl: `/auth/verify-request?email=${encodeURIComponent(email)}` }

  } catch (error) {
    console.error("Sign up error:", error)
    
    if (error instanceof AuthError) {
      return { success: false, error: error.type || error.message }
    }
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        return { success: false, error: 'EMAIL_ALREADY_EXISTS' }
      }
      
      if (error.message.includes('Database')) {
        return { success: false, error: 'DATABASE_ERROR' }
      }
      return { success: false, error: error.message }
    }
    
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function signUpWithEmail(email: string) {
  try {
    // Check if email is valid format (zod already validated on client, but double-check server-side)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: 'INVALID_EMAIL' }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { success: false, error: 'EMAIL_ALREADY_EXISTS' }
    }

    // Create user with minimal data (other fields will be filled after email verification)
    const user = await prisma.user.create({
      data: {
        email,
        name: "", // Will be filled later or can be optional
        role: 'APPLICANT', // Default role
      },
    })

    // Generate verification token and send email
    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(email, verificationToken.token)

    return { success: true, user, redirectUrl: `/auth/verify-request?email=${encodeURIComponent(email)}` }
  } catch (error) {
    console.error("Sign up error:", error)
    
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
      redirect: true,
    })
    // This will redirect, so code after won't execute
  } catch (error) {
    // NextAuth throws a redirect error during OAuth flow - this is normal
    if ((error as { url?: string; cause?: { url?: string } })?.url || (error as { url?: string; cause?: { url?: string } })?.cause?.url) {
      // This is expected - the redirect is happening
      throw error // Re-throw to let Next.js handle the redirect
    }
    
    // Only log actual errors, not redirects
    console.error("Actual OAuth sign in error:", error)
    throw error
  }
}

// Optional: Add a function to resend verification email
export async function resendVerificationEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true }
    })

    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' }
    }

    if (user.emailVerified) {
      return { success: false, error: 'EMAIL_ALREADY_VERIFIED' }
    }

    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(email, verificationToken.token)

    return { success: true, message: 'VERIFICATION_EMAIL_RESENT' }
  } catch (error) {
    console.error("Resend verification error:", error)
    return { success: false, error: "Failed to resend verification email" }
  }
}