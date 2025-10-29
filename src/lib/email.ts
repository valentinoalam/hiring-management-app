import { Resend } from "resend"

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Verify your email address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .button { 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #007bff; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    margin: 20px 0;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #eee; 
                    text-align: center; 
                    color: #666; 
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Verify Your Email Address</h1>
                </div>
                <p>Hello,</p>
                <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
                <div style="text-align: center;">
                    <a href="${confirmLink}" class="button">Verify Email Address</a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p><a href="${confirmLink}">${confirmLink}</a></p>
                <p>This verification link will expire in 1 hour.</p>
                <p>If you didn't create an account, please ignore this email.</p>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Rakamin. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending verification email:", error)
      throw new Error("Failed to send verification email")
    }

    return data
  } catch (error) {
    console.error("Error sending verification email:", error)
    throw new Error("Failed to send verification email")
  }
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Reset your password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .button { 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #dc3545; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    margin: 20px 0;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #eee; 
                    text-align: center; 
                    color: #666; 
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset Your Password</h1>
                </div>
                <p>Hello,</p>
                <p>You requested to reset your password. Click the button below to create a new password:</p>
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>This password reset link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Rakamin. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending password reset email:", error)
      throw new Error("Failed to send password reset email")
    }

    return data
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw new Error("Failed to send password reset email")
  }
}

export const sendMagicLinkEmail = async (email: string, token: string, callbackUrl?: string) => {
  const signInLink = callbackUrl 
    ? `${process.env.NEXTAUTH_URL}/api/auth/callback/email?token=${token}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : `${process.env.NEXTAUTH_URL}/api/auth/callback/email?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Your Magic Link for Rakamin",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .button { 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #28a745; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    margin: 20px 0;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #eee; 
                    text-align: center; 
                    color: #666; 
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Magic Link is Here! ✨</h1>
                </div>
                <p>Hello,</p>
                <p>You requested to sign in to your Rakamin account. Click the button below to securely log in:</p>
                <div style="text-align: center;">
                    <a href="${signInLink}" class="button">Sign In to Rakamin</a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p><a href="${signInLink}">${signInLink}</a></p>
                <p>This magic link will expire in 1 hour and can only be used once.</p>
                <p>If you didn't request this sign in link, please ignore this email.</p>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Rakamin. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending magic link email:", error)
      throw new Error("Failed to send magic link email")
    }

    return data
  } catch (error) {
    console.error("Error sending magic link email:", error)
    throw new Error("Failed to send magic link email")
  }
}