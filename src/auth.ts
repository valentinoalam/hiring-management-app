import "server-only";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { authConfig } from "./auth.config"; // Relative import within src/

export const providerMap = authConfig.providers
  .map((provider: Provider) => {
    if (typeof provider === "function") {
      const providerData = provider()
      return { id: providerData.id, name: providerData.name }
    } else {
      return { id: provider.id, name: provider.name }
    }
  })
  .filter((provider) => provider.id !== "credentials")

// 💡 Wrap the config and export the new V5 utilities
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// The 'handlers' object contains { GET, POST } for your API route.
// 'auth' is the server-side utility to get session data.