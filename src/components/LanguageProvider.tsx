"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { translations, type Locale, type TranslationKey } from "@/lib/translations"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "id",
  setLocale: () => {},
  t: (key: TranslationKey) => translations[key]?.id || key,
})

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id")
  const [mounted, setMounted] = useState(false)

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("sovia-lang") as Locale | null
    if (savedLocale === "en" || savedLocale === "id") {
      setLocaleState(savedLocale)
      document.documentElement.setAttribute("lang", savedLocale)
    } else {
      // Default to Indonesian
      document.documentElement.setAttribute("lang", "id")
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("sovia-lang", newLocale)
    document.documentElement.setAttribute("lang", newLocale)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string>): string => {
      let text: string = translations[key]?.[locale] || translations[key]?.id || key
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replace(`{${param}}`, value)
        })
      }
      return text
    },
    [locale]
  )

  // Prevent flash of wrong language
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
