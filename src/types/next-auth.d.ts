// types/next-auth.d.ts
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    fullName?: string
    email: string
    role?: UserRole
    isVerified?: boolean
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: UserRole
    fullName?: string
    isVerified?: boolean
  }
}