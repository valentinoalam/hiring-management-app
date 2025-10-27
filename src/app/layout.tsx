import type React from "react"
import type { Viewport } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/layout/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/layout/footer"
import { generateMetaData } from "@/utils/metadata"
import { NextAuthProvider } from "@/components/layout/providers/next-auth-provider"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { Analytics } from "@vercel/analytics/next"
import { auth } from '@/auth'
const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata() {
  return generateMetaData();
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: 'white',
  interactiveWidget: 'resizes-visual',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider session={session}> 
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
            <Analytics />
            <Footer />
            <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
