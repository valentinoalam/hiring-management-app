import { UserRole } from "@prisma/client";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
}
