"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, Package, ShoppingCart, Users, FileBarChart, Image as ImageIcon, LogOut, Folder, Store, Menu, X, User, Sun, Moon, Globe, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [storeName, setStoreName] = useState("Sovia Fashion")
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale } = useLanguage()

  useEffect(() => {
    fetch("/api/admin/store-profile")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.name) setStoreName(data.name)
      })
      .catch(() => {})
  }, [])

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
        <Link href="/" className="text-sovia-800 text-lg font-serif flex items-center gap-2 font-semibold">  
          <img src={theme === "dark" ? "/just-logo-dark.png" : "/just-logo.png"} alt={`logo by ${storeName}`} className="h-[32px] w-auto" /> 
          {storeName}
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/cart" className="p-2 text-sovia-800 hover:bg-sovia-100 rounded-lg relative">
            <ShoppingCart className="w-5 h-5" />
          </Link>
          <Link href="/profile" className="p-2 text-sovia-800 hover:bg-sovia-100 rounded-lg">
            <User className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-sovia-800 hover:bg-sovia-100 rounded-lg"
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
        "fixed left-0 top-0 bottom-0 border-r border-sovia-200/30 flex flex-col z-40 transition-all duration-300 ease-in-out z-[1000] backdrop-blur-xl",
        isMobileMenuOpen ? "translate-x-0 w-64 bg-sovia-100" : "-translate-x-full w-64 lg:translate-x-0 bg-sovia-100/60",
        isCollapsed ? "lg:w-20" : "lg:w-60"
      )}>
        <div className="p-4 border-b border-sovia-200/20 relative">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-5 top-10 w-10 h-10 bg-sovia-50 border-3 border-sovia-100/50 rounded-full items-center justify-center text-sovia-600 hover:text-sovia-900 shadow-sm z-50 transition-transform active:transform-[scale(0.95)]"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5 font-black" /> : <ChevronLeft className="w-5 h-5 font-black" />}
          </button>

          <Link href="/" className={cn("text-sovia-800 text-xl font-serif flex items-center gap-2 mb-6 hidden lg:flex font-semibold transition-all duration-300", isCollapsed ? "justify-center" : "px-2")}>
            <img src={theme === "dark" ? "/just-logo-dark.png" : "/just-logo.png"} alt={`logo by ${storeName}`} className="h-[32px] w-auto transition-all duration-300" />
            {!isCollapsed && <span className="text-xl truncate">{storeName}</span>}
          </Link>
          
          <div className={cn("flex items-center gap-3 transition-all duration-300", isCollapsed ? "justify-center" : "px-2")}>
            <div className="w-10 h-10 min-w-[40px] bg-sovia-200 rounded-xl overflow-hidden">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Admin"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sovia-900 text-sm font-semibold truncate">Admin Panel</p>
                <p className="text-sovia-700 text-xs truncate">Editorial Control</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-4">
          {adminGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.title && !isCollapsed && (
                <div className="px-3 mb-2">
                  <h3 className="text-[10px] font-black text-sovia-700 uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
              )}
              {group.title && isCollapsed && (
                <div className="h-px bg-sovia-200/50 my-2 mx-4" />
              )}
              {group.links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={isCollapsed ? link.label : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:transform-[scale(0.95)]",
                      isCollapsed ? "justify-center" : "",
                      isActive
                        ? "bg-sovia-200/50 text-sovia-800 shadow-sm"
                        : "text-sovia-600 hover:bg-sovia-100 hover:text-sovia-700"
                    )}
                  >
                    <link.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{link.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sovia-200/20 space-y-2">
          <button
            onClick={toggleTheme}
            title={isCollapsed ? (theme === "light" ? "Dark Mode" : "Light Mode") : undefined}
            className={cn(
              "flex items-center p-2.5 bg-sovia-200/50 hover:bg-sovia-200/25 rounded-lg transition-colors text-sovia-800 text-sm font-medium w-full active:transform-[scale(0.95)]",
              isCollapsed ? "justify-center" : "justify-center gap-2"
            )}
          >
            {theme === "light" ? <Moon className="w-4 h-4 flex-shrink-0" /> : <Sun className="w-4 h-4 flex-shrink-0" />}
            {!isCollapsed && <span>{theme === "light" ? "Dark" : "Light"}</span>}
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Logout" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sovia-800 hover:bg-sovia-200/50 transition-colors w-full active:transform-[scale(0.95)]",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-4 md:p-6 pt-20 lg:pt-6 w-full max-w-[100vw] min-h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:ml-20" : "lg:ml-60"
      )}>
        {children}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-sovia-100">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-rose-600 flex items-center gap-2">
                <LogOut className="w-5 h-5" /> Konfirmasi Keluar
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun Anda?
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-50/80 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100 rounded-lg transition-colors border border-sovia-200 bg-sovia-100 shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="px-4 py-2 text-sm font-medium text-sovia-50 rounded-lg shadow-sm transition-colors bg-rose-600 hover:bg-rose-700"
              >
                Yakin Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}