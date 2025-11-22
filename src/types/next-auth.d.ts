// types/next-auth.d.ts
import { UserRole } from "@/generated/prisma/client"
import { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
      emailVerified?: Date;
      // fullName?: string; // Now from profile
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    emailVerified?: Date;
    // name is now from User model
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: UserRole
    name?: string
    emailVerified?: Date
  }
}