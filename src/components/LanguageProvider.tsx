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

/**
 * Hook untuk menggunakan konteks bahasa aktif (locale, setLocale, dan fungsi terjemahan t)
 * di seluruh komponen aplikasi.
 */
export function useLanguage() {
  return useContext(LanguageContext)
}

/**
 * Komponen Provider untuk membungkus aplikasi dan menyediakan status bahasa (lokalisasi)
 * yang tersimpan secara lokal di localStorage.
 */
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

  /**
   * Mengubah bahasa aktif aplikasi dan menyimpannya ke dalam localStorage
   * serta mengubah atribut lang pada dokumen HTML utama.
   */
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("sovia-lang", newLocale)
    document.documentElement.setAttribute("lang", newLocale)
  }, [])

  /**
   * Fungsi untuk menerjemahkan kunci teks berdasarkan bahasa aktif.
   * Mendukung substitusi parameter seperti {year}.
   * 
   * @param key - Kunci terjemahan dari kamus data translations
   * @param params - Parameter opsional untuk mengganti placeholder dalam string terjemahan
   * @returns String teks yang sudah diterjemahkan
   */
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
