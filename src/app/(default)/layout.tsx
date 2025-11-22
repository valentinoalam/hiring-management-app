import Header from "@/components/layout/header"
import type React from "react"
export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 grow flex flex-col min-w-0 relative">
      <Header />
      <main className="mt-16 relative flex flex-1 flex-col gap-4">
        {children}
      </main>
    </div>
  )
}
