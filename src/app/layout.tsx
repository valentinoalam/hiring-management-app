import type React from "react"
import type { Viewport } from "next"
import { Nunito_Sans } from "next/font/google"
import "@/styles/globals.css"
import { generateMetaData } from "@/config/metadata"
import { auth } from '@/auth'
import ClientInitializer from "@/components/layout/providers/ClientInitializer"
import { QueryProvider } from "@/components/layout/providers/query-provider"

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
        <QueryProvider> 
          <ClientInitializer session={session}>
            {children}
          </ClientInitializer>
        </QueryProvider>
      </body>
    </html>
  )
}
