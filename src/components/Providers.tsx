"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./ThemeProvider"
import { LanguageProvider } from "./LanguageProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}