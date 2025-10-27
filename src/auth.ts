// src/auth.ts

import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; // Relative import within src/

// 💡 Wrap the config and export the new V5 utilities
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// The 'handlers' object contains { GET, POST } for your API route.
// 'auth' is the server-side utility to get session data.