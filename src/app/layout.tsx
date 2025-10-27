import type React from "react"
import type { Viewport } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/layout/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/layout/footer"
import { generateMetaData } from "@/utils/metadata"
import { NextAuthProvider } from "@/components/layout/providers/next-auth-provider"
import getServerSession from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { AuthProvider } from "@/components/layout/providers/auth-provider"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })
// const _geist = Geist({ subsets: ["latin"] })
// const _geistMono = Geist_Mono({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "HireFlow - Hiring Management Platform",
//   description: "A modern hiring platform connecting recruiters and job seekers",
//   generator: "v0.app",
// }

export async function generateMetadata() {
  return generateMetaData();
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: 'white',
  // interactiveWidget: 'resizes-visual',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider session={session as any}>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>{children}</AuthProvider>
              </QueryClientProvider>
              <Analytics />
              <Footer />
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
