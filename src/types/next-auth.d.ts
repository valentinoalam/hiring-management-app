// types/next-auth.d.ts
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    fullName?: string | null
    role?: UserRole | null
    image?: string | null
    name?: string | null
    isVerified?: boolean | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      fullName: string
      image?: string | null
      role: UserRole
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    name: string
    fullName: string
    email: string
    image?: string | null
    isVerified?: boolean | null
  }
}
