// lib/actions/email-actions.ts
'use server';

import { prisma } from '@/lib/prisma.js';
import { generateVerificationToken } from '@/lib/tokens.js';
import { sendVerificationEmail } from '@/lib/email.js';
import { signOut } from '@/auth.js';

export async function resendVerificationEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true }
    });

    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    if (user.emailVerified) {
      return { success: false, error: 'EMAIL_ALREADY_VERIFIED' };
    }

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token);

    return { success: true, message: 'VERIFICATION_EMAIL_RESENT' };
  } catch (error) {
    console.error("Resend verification error:", error);
    return { success: false, error: "Failed to resend verification email" };
  }
}

// Optional: You can also add a function to handle magic link resend
export async function resendMagicLink(email: string) {
  try {
    // This would use your existing magic link functionality
    // You might need to import and use your existing magic link logic here
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    // Add your magic link resend logic here
    // For example, if using NextAuth email provider:
    // await signIn('email', { email, redirect: false });
    
    return { success: true, message: 'MAGIC_LINK_RESENT' };
  } catch (error) {
    console.error("Resend magic link error:", error);
    return { success: false, error: "Failed to resend magic link" };
  }
}

export async function signOutAction(redirectPath: string = '/goodbye') {
  try {
    await signOut({ 
      redirectTo: redirectPath,
      redirect: true 
    });
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}