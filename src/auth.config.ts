/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextAuthConfig, User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from 'next-auth/providers/google'
import Email from 'next-auth/providers/nodemailer'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@/lib/prisma'
import { compare } from "bcryptjs"
import type { UserRole } from "@prisma/client" 

// try {;
  
//   // Test connection on startup
//   await prisma.$queryRaw`SELECT 1`;
//   console.log('✅ Database connected in auth config');
// } catch (error) {
//   console.error('❌ Database connection failed in auth config:', error);
//   throw new Error('Database connection failed');
// }

async function markUserAsLoggedIn(email: string, verified = true) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.warn(`User with email ${email} not found for login update`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        lastLoginAt: new Date(),
        isVerified: verified,
      },
    });
  } catch (error) {
    console.error('Error updating user login:', error);
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
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
            name: user.name, // Map name to the standard 'name' property
            role: user.role,
            image: null, // No image field in your DB user model directly
            isVerified: user.isVerified,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          // Return null to deny access and redirect to the error page
          return null 
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Email({
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name ?? user.name
        token.role = user.role
        token.isVerified = user.isVerified
      }

      if (trigger && trigger === "update" && session?.user?.id && prisma) {
        const dbUser = await prisma.user.findFirstOrThrow({
          where: { id: session.user.id },
        })
        if (dbUser) {
          token.name = dbUser.name
          token.role = dbUser.role
          token.isVerified = dbUser.isVerified
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.name = token.name as string
        session.user.role = token.role as UserRole
        session.user.isVerified = token.isVerified as boolean
      }
      return session;
    },
    async signIn({ user, account }) {
      if (user?.email && account?.provider !== "credentials" && prisma) {
        // Mark OAuth and Email login users as verified
        await markUserAsLoggedIn(user.email, true)
      }
      return true
    },
  },
  events: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'email' && user.email) {
          await markUserAsLoggedIn(user.email, true);
        }
        
        if (account?.provider !== 'credentials' && user.email) {
          await markUserAsLoggedIn(user.email, true);
        }
      } catch (error) {
        console.error('Error in signIn event:', error);
      }
    },
    
    async createUser({ user }) {
      try {
        if (user?.id) {
          await prisma.profile.create({
            data: {
              userId: user.id,
              fullname: user.name || "",
              bio: "I am a new user!",
            },
          });
          console.log(`✅ Profile created for new user: ${user.email}`);
        }
      } catch (error) {
        console.error('Error creating profile:', error);
      }
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/sign-up",
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