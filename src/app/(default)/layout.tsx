import Header from "@/components/layout/header"
import type React from "react"
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 grow flex flex-col min-w-0 relative">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto gap-4 no-scrollbar">
        {children}
      </main>
    </div>
  )
}
