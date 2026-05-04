"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { ShoppingCart, User, Menu, X, Sun, Moon } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/catalog", label: "Katalog" },
  { href: "/virtual-tryon", label: "Virtual Try-On" },
]

export function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const { theme, toggleTheme } = useTheme()

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    if (session?.user) {
      fetch("/api/cart")
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setCartCount(data.length)
          }
        })
        .catch(() => {})
    } else {
      setCartCount(0)
    }
  }, [session])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-sovia-50/70 backdrop-blur-[6px] border-b border-sovia-200/20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-sovia-600 text-2xl font-['Noto_Serif'] tracking-[4.80px] font-semibold">
          SOVIA
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-sovia-600 border-b-2 border-accent-300"
                  : "text-sovia-500 hover:text-sovia-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-sovia-100 transition-all duration-300 relative overflow-hidden"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
          >
            <div className="relative w-5 h-5">
              <Sun
                className={cn(
                  "w-5 h-5 text-sovia-600 absolute inset-0 transition-all duration-300",
                  theme === "light"
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 rotate-90 scale-50"
                )}
              />
              <Moon
                className={cn(
                  "w-5 h-5 text-accent-400 absolute inset-0 transition-all duration-300",
                  theme === "dark"
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 -rotate-90 scale-50"
                )}
              />
            </div>
          </button>

          {status === "loading" ? null : session ? (
            <>
              <Link
                href="/cart"
                className="p-2 hover:bg-sovia-100 rounded-lg transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5 text-sovia-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="p-2 hover:bg-sovia-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 text-sovia-600" />
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-sovia-600 text-white text-sm font-medium rounded-lg hover:bg-sovia-700 transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-sovia-500 hover:text-sovia-600 transition-colors"
              >
                Keluar
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-6 py-2 bg-sovia-600 text-white text-sm font-medium rounded-lg hover:bg-sovia-700 transition-colors"
            >
              Masuk
            </button>
          )}

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-sovia-600" />
            ) : (
              <Menu className="w-5 h-5 text-sovia-600" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-sovia-50 border-t border-sovia-200 px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium py-2",
                pathname === link.href
                  ? "text-sovia-600 border-b-2 border-accent-300"
                  : "text-sovia-500"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Theme toggle in mobile menu */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-sm text-sovia-500 py-2"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4" />
                Mode Gelap
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                Mode Terang
              </>
            )}
          </button>

          {session && (
            <Link
              href="/cart"
              className="text-sm text-sovia-500 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Keranjang
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}