"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
})

/**
 * Hook untuk menggunakan status tema aktif (light/dark) dan fungsi pengubah tema (toggleTheme).
 */
export function useTheme() {
  return useContext(ThemeContext)
}

/**
 * Provider komponen untuk membungkus aplikasi dan menyajikan/mengelola state tema
 * yang disinkronkan dengan localStorage serta kelas CSS di root HTML.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("sovia-theme") as Theme | null
    if (savedTheme === "dark") {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    } else {
      setTheme("light")
      document.documentElement.classList.remove("dark")
    }
    setMounted(true)
  }, [])

  /**
   * Mengubah tema aktif dari terang ke gelap (atau sebaliknya), menyimpan preferensi
   * di localStorage, dan memperbarui class list pada elemen root HTML.
   */
  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("sovia-theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
