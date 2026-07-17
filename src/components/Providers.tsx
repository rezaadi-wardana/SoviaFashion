"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./ThemeProvider"
import { LanguageProvider } from "./LanguageProvider"

/**
 * Komponen penyedia konteks global (Wrapper Providers) yang menggabungkan
 * SessionProvider (NextAuth), ThemeProvider (Tema), dan LanguageProvider (Bahasa).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}