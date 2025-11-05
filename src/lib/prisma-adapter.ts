// lib/custom-prisma-adapter.ts
import { prisma } from "@/lib/prisma"
import type { Adapter } from "next-auth/adapters"

export const CustomPrismaAdapter: Adapter = {
  async createUser(user) {
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name || "",
        isVerified: true, // OAuth users are automatically verified
        role: "APPLICANT",
      },
    })

    // Create profile for the user
    await prisma.profile.create({
      data: {
        userId: newUser.id,
        fullname: user.name || "", // Set fullname from OAuth name
      },
    })

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      emailVerified: null,
      image: null,
      role: newUser.role,
      isVerified: newUser.isVerified,
    }
  },

  async getUser(id) {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: null,
      image: null,
      role: user.role,
      isVerified: user.isVerified,
    }
  },

  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: null,
      image: null,
      role: user.role,
      isVerified: user.isVerified,
    }
  },

  async getUserByAccount({ providerAccountId, provider }) {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    })

    if (!account) return null

    return {
      id: account.user.id,
      email: account.user.email,
      name: account.user.name,
      emailVerified: null,
      image: null,
      role: account.user.role,
      isVerified: account.user.isVerified,
    }
  },

  async updateUser(user) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name || undefined,
        email: user.email,
      },
    })

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      emailVerified: null,
      image: null,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
    }
  },

  async linkAccount(account) {
    await prisma.account.create({
      data: {
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: typeof account.session_state === 'string' ? account.session_state : undefined,
      },
    })
  },

  async createSession(session) {
    return session
  },

  async getSessionAndUser(sessionToken) {
    return null
  },

  async updateSession(session) {
    return session
  },

  async deleteSession(sessionToken) {
    return
  },

  async unlinkAccount({ providerAccountId, provider }) {
    await prisma.account.delete({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    })
  },

  async deleteUser(userId) {
    await prisma.user.delete({
      where: { id: userId },
    })
  },
}