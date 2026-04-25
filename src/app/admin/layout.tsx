"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, Package, ShoppingCart, Users, FileBarChart, Image, LogOut, Folder, Store } from "lucide-react"
import { cn } from "@/lib/utils"

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
      { href: "/admin/hero", label: "Hero Slider", icon: Image },
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

  console.log("Admin layout session:", session)
  console.log("Admin layout role:", session?.user?.role)

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 fixed left-0 top-0 bottom-0 bg-stone-50 border-r border-stone-200/30 flex flex-col">
        <div className="p-6 border-b border-stone-200/20">
          <h1 className="text-stone-600 text-2xl font-serif tracking-[2.40px] mb-4">
            SOVIA
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-200 rounded-xl overflow-hidden">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Admin"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-stone-900 text-sm font-semibold">Admin Panel</p>
              <p className="text-stone-700 text-xs">Editorial Control</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-6">
          {adminGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.title && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
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
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-rose-200 text-stone-600"
                        : "text-stone-500 hover:bg-stone-100"
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

        <div className="p-4 border-t border-stone-200/20 space-y-1">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 bg-stone-50">{children}</main>
    </div>
  )
}