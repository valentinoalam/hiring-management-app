import type React from "react"
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return  (
    <main className="relative flex flex-1 flex-col min-h-screen overflow-auto no-scrollbar">
      {children}
    </main>
  )
}
