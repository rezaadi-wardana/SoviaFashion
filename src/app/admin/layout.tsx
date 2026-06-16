"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, Package, ShoppingCart, Users, FileBarChart, Image as ImageIcon, LogOut, Folder, Store, Menu, X, User, Sun, Moon, Globe } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"
import { useLanguage } from "@/components/LanguageProvider"

const adminGroups = [
  {
    title: "",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    ]
  },
  {
    title: "Management",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Folder },
      { href: "/admin/users", label: "Customers", icon: Users },
    ]
  },
  {
    title: "Advanced",
    links: [
      { href: "/admin/store-profile", label: "Profil Toko", icon: Store },
      { href: "/admin/hero", label: "Hero Slider", icon: ImageIcon },
    ]
  },
  {
    title: "Reports",
    links: [
      { href: "/admin/reports", label: "Report", icon: FileBarChart },
    ]
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale } = useLanguage()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in as admin</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-sovia-50">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sovia-50 border-b border-sovia-200/30 z-50 flex items-center justify-between px-4">
        <Link href="/" className="text-sovia-600 text-xl font-serif flex items-center gap-2 font-semibold">  <img src={theme === "dark" ? "/just-logo-dark.png" : "/just-logo.png"} alt="logo by sovia fashion" className="h-[40px] w-auto" /> Sovia Fashion</Link>
        <div className="flex items-center gap-1">
          <Link href="/cart" className="p-2 text-sovia-600 hover:bg-sovia-100 rounded-lg relative">
            <ShoppingCart className="w-5 h-5" />
          </Link>
          <Link href="/profile" className="p-2 text-sovia-600 hover:bg-sovia-100 rounded-lg">
            <User className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-sovia-600 hover:bg-sovia-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 fixed left-0 top-0 bottom-0 bg-sovia-50 border-r border-sovia-200/30 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-sovia-200/20">
          <Link href="/" className="text-sovia-600 text-2xl font-serif flex items-center gap-2 mb-4 hidden lg:block font-semibold">
        <img src={theme === "dark" ? "/just-logo-dark.png" : "/just-logo.png"} alt="logo by sovia fashion" className="h-[40px] w-auto" /> Sovia Fashion
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sovia-200 rounded-xl overflow-hidden">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Admin"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-sovia-900 text-sm font-semibold">Admin Panel</p>
              <p className="text-sovia-700 text-xs">Editorial Control</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-6">
          {adminGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.title && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-sovia-400 uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
              )}
              {group.links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent-200 text-sovia-600"
                        : "text-sovia-500 hover:bg-sovia-100"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-sovia-200/20 space-y-1">
          <div className="flex items-center gap-2 mb-2 px-2">
            {/* <button
              onClick={() => setLocale(locale === "id" ? "en" : "id")}
              className="flex items-center justify-center flex-1 p-2 bg-sovia-100 hover:bg-sovia-200 rounded-lg transition-colors text-sovia-600 text-sm font-medium"
            >
              <Globe className="w-4 h-4 mr-2" />
              {locale === "id" ? "ID" : "EN"}
            </button> */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center flex-1 p-2 bg-sovia-100 hover:bg-sovia-200 rounded-lg transition-colors text-sovia-600 text-sm font-medium"
            >
              {theme === "light" ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
              {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sovia-500 hover:bg-sovia-100 w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8 w-full max-w-[100vw]">{children}</main>
    </div>
  )
}