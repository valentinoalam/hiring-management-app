// types/next-auth.d.ts
import { UserRole } from "@prisma/client"
import { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
      isVerified?: boolean;
      // fullName?: string; // Now from profile
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    isVerified?: boolean;
    // name is now from User model
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: UserRole
    name?: string
    isVerified?: boolean
  }
}