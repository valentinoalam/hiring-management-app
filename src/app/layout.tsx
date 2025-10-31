import type React from "react"
import type { Viewport } from "next"
import { Nunito_Sans } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/layout/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { generateMetaData } from "@/config/metadata"
import { NextAuthProvider } from "@/components/layout/providers/next-auth-provider"
import { QueryProvider } from "@/components/layout/providers/query-provider"
import { Analytics } from "@vercel/analytics/next"
import { auth } from '@/auth'
import Header from "@/components/layout/header"

const nunitoSans = Nunito_Sans({ subsets: ["latin"] })

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
      <body className={nunitoSans.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider> 
            <NextAuthProvider session={session}>  
              <div className="flex-1 grow flex flex-col min-w-0 relative">
                <Header />
                <main className="relative flex flex-1 flex-col overflow-auto gap-4 md:p-4">
                  {children}
                </main>
              </div>
            </NextAuthProvider>
          </QueryProvider>
          <Analytics />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
