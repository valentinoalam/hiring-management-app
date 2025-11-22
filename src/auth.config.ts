import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from 'next-auth/providers/google'
import Email from 'next-auth/providers/nodemailer'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@/lib/prisma'
import { compare } from "bcryptjs"
import { UserRole } from "@/generated/prisma/enums"

// try {;
  
//   // Test connection on startup
//   await prisma.$queryRaw`SELECT 1`;
//   console.log('✅ Database connected in auth config');
// } catch (error) {
//   console.error('❌ Database connection failed in auth config:', error);
//   throw new Error('Database connection failed');
// }

async function markUserAsLoggedIn(email: string) {
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
        emailVerified: new Date(),
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
          // if (!user.emailVerified) {
          //     // This error message will be displayed on the sign-in error page
          //     throw new Error('Email not verified. Please check your inbox for the verification link.')
          // }

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
            image: user.image, // No image field in your DB user model directly
            emailVerified: user.emailVerified || undefined,
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
      // Initial sign in
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name ?? user.name;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }

      // Update token when session is updated
      if (trigger === "update" && session?.user?.id) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: { id: session.user.id },
            select: {
              name: true,
              role: true,
              emailVerified: true,
              email: true,
            },
          });
          
          if (dbUser) {
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
            token.email = dbUser.email;
          }
        } catch (error) {
          console.error('Error updating JWT token:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.name = token.name as string
        session.user.role = token.role as UserRole
        session.user.emailVerified = token.emailVerified as Date
      }
      return session;
    },
    async signIn({ user, account }) {
      if (user?.email && account?.provider !== "credentials" && prisma) {
        // Mark OAuth and Email login users as verified
        await markUserAsLoggedIn(user.email)
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      // Redirect to custom page after sign out
      if (url.includes('signout')) {
        return `${baseUrl}/auth/signout`;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  events: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'email' && user.email) {
          await markUserAsLoggedIn(user.email);
        }
        
        if (account?.provider !== 'credentials' && user.email) {
          await markUserAsLoggedIn(user.email);
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
    signOut: "/auth/signout",
    // newUser: "/welcome",
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