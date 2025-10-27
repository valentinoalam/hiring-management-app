/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextAuthConfig, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma" // Assuming this is correct
import { compare } from "bcryptjs"
import type { UserRole } from "@prisma/client" // Assuming UserRole enum is defined

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required.')
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user) {
            throw new Error('Account not found.')
          }

          if (!user.password) {
            throw new Error('This account uses a different login method.')
          }
          
          // 💡 NEW CHECK: Stop login if email is not verified
          if (!user.isVerified) {
              // This error message will be displayed on the sign-in error page
              throw new Error('Email not verified. Please check your inbox for the verification link.')
          }

          const isPasswordValid = await compare(credentials.password as string, user.password)
          if (!isPasswordValid) {
            throw new Error('Invalid password.')
          }

          // 💡 Return user object matching your schema and custom types
          return {
            id: user.id,
            email: user.email,
            name: user.fullName, // Map fullName to the standard 'name' property
            fullName: user.fullName,
            role: user.role,
            image: null, // No image field in your DB user model directly
          }
        } catch (error) {
          console.error('Authentication error:', error)
          // Return null to deny access and redirect to the error page
          return null 
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // You can keep or remove the 'authorization' block based on need, 
      // but it's not strictly necessary for basic sign-in.
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session, account }) {
      // 💡 Initial sign in (User object is available here)
      if (user) {
        token.id = user.id
        token.email = user.email
        // Map custom fields to the token
        token.name = (user as User).fullName! || user.name!
        token.role = (user as User).role!
      }

      // 💡 Handle session updates (e.g., refreshing user data)
      if (trigger === "update" && session?.user) {
        // Find the latest user data to update the token
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          // include: { profile: true } // Removed include profile if not needed for simple token fields
        })
        
        if (dbUser) {
          token.name = dbUser.fullName
          token.role = dbUser.role
          // 💡 NEW: Update isVerified status if needed
          token.isVerified = dbUser.isVerified
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // 💡 Add custom token info to the session
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.fullName = token.name as string // Assuming token.name holds fullName
        // session.user.image is not consistently available, cast as null or use token.picture if needed
        session.user.image = token.picture as string | null
        // 💡 NEW: Add isVerified status to session for client checks
        (session.user as User).isVerified = (token as JWT).isVerified
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // 💡 IMPORTANT: Update lastLoginAt and isVerified for magic link sign-in
      if (account?.provider === 'email' && user.email) {
          await prisma.user.update({
              where: { email: user.email },
              data: { 
                  lastLoginAt: new Date(),
                  isVerified: true // Set to true after successful magic link verification
              }
          });
      }
      
      // 💡 IMPORTANT: Update lastLoginAt for OAuth sign-in
      if (account?.provider !== 'credentials' && user.email) {
          await prisma.user.update({
              where: { email: user.email },
              data: { 
                  lastLoginAt: new Date(),
                  // If using OAuth, the user is generally considered verified
                  isVerified: true 
              }
          });
      }
      
      // Credentials verification includes isVerified check in authorize()
      return true
    },
  },
  events: {
    // 💡 Update lastLoginAt for credentials sign-in success
    async signIn({ user, account }) {
      if (account?.provider === 'email' && user.email) {
          await prisma.user.update({
              where: { email: user.email },
              data: { 
                  lastLoginAt: new Date(),
                  isVerified: true 
              }
          })
      }
      // 💡 Also update lastLoginAt for OAuth sign-in
      if (account?.provider !== 'credentials' && user.email) {
          await prisma.user.update({
              where: { email: user.email },
              data: { 
                  lastLoginAt: new Date(),
                  isVerified: true 
              }
          });
      }
      
    },
    // 💡 Event to initialize custom data when the PrismaAdapter creates a new user (via OAuth/Email)
    async createUser({ user }) {
        if (user.id) {
            
            // 1. Create the mandatory Profile record linked to the new User.
            await prisma.profile.create({
                data: {
                    userId: user.id,
                    // Note: All other fields (bio, phone, location, etc.) 
                    // are optional (String?) in our schema, so we omit them 
                    // and let them default to NULL in the database.
                }
            });
            
            console.log(`Profile created and linked for new user: ${user.email}`);

            // 2. EXAMPLE: Initialize default custom fields (OtherUserInfo)
            // If you have InfoFields that should exist for every new user, 
            // you could create initial "OtherUserInfo" entries here.
            // Example: Initialize a "Welcome" field answer. (Requires InfoField model setup)
            /*
            const welcomeField = await prisma.infoField.findUnique({
                where: { key: 'welcome_message_id' }
            });
            
            if (welcomeField) {
                await prisma.otherUserInfo.create({
                    data: {
                        profileId: user.id, // Assuming the newly created profile uses the userId as its ID for simplicity, or fetch the profile ID
                        fieldId: welcomeField.id,
                        infoFieldAnswer: 'Welcome to the platform! Please complete your profile.'
                    }
                });
            }
            */
        }
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error", 
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}