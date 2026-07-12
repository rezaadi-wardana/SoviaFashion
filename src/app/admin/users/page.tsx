"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import { Trash2, Users as UsersIcon, Search, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import LoadingOverlay from "@/components/ui/LoadingOverlay"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  phone: string | null
  createdAt: string
  _count: { orders: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: "ROLE" | "DELETE" | null; userId: string; newRole: string | null }>({ isOpen: false, action: null, userId: "", newRole: null })

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(userId: string, newRole: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        toast.success("Role berhasil diperbarui")
        fetchUsers()
      } else {
        toast.error("Gagal memperbarui role")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengupdate role")
      console.error("Error updating role:", error)
    }
  }

  async function deleteUser(userId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Pengguna berhasil dihapus")
        fetchUsers()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Gagal menghapus pengguna")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus pengguna")
      console.error("Error deleting user:", error)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingOverlay />

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 bg-sovia-50/90 backdrop-blur-sm pt-4 pb-4 -mt-4 -mx-4 px-4 mb-6 border-b border-sovia-200/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-sovia-900 text-3xl font-serif mb-2">Kelola Pelanggan</h1>
            <p className="text-sovia-700 text-sm">
              Lihat dan kelola pelanggan terdaftar.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-sovia-200/30 border border-sovia-200/50 rounded-lg text-sm focus:outline-none focus:border-sovia-400 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sovia-700" />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-sovia-500">Tidak ada pelanggan ditemukan</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setViewingUser(user)}
              className="bg-sovia-100 rounded-2xl p-6 shadow-sm border border-sovia-200/50 relative group cursor-pointer hover:shadow-md hover:border-sovia-300 transition-all flex flex-col"
            >
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-sovia-200 rounded-full overflow-hidden">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={64}
                      height={64}
                      className="object-cover w-auto h-auto"
                    />
                  ) : (
                    <UsersIcon className="w-full h-full p-3 text-sovia-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sovia-900 font-medium truncate">{user.name || "No name"}</p>
                  <p className="text-sovia-500 text-sm truncate">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-sovia-500">No. Telepon</span>
                  <span className="text-sovia-700">{user.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sovia-500">Bergabung Sejak</span>
                  <span className="text-sovia-700">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sovia-500">Pesanan</span>
                  <span className="text-sovia-700">{user._count.orders}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-sovia-200 mt-auto">
                  <span className="text-sovia-500">Role</span>
                  <div className="flex items-center gap-2">
                    <RoleSelect
                      user={user}
                      onChange={(newRole) => setConfirmModal({ isOpen: true, action: "ROLE", userId: user.id, newRole })}
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmModal({ isOpen: true, action: "DELETE", userId: user.id, newRole: null })
                      }}
                      className="p-1.5 bg-rose-800 text-rose-50 hover:bg-rose-900 rounded-lg transition-colors active:scale-95 border border-rose-800"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmModal.isOpen && confirmModal.action === "ROLE" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-sovia-900">
                Ubah Role Pengguna
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                Apakah kamu yakin ingin mengubah role pengguna ini menjadi {confirmModal.newRole}?
                {confirmModal.newRole === "ADMIN" && " Perhatian: Pengguna akan mendapatkan akses ke dashboard Admin."}
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-50 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null, userId: "", newRole: null })}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100 bg-sovia-50 rounded-lg transition-colors border border-sovia-200 shadow-sm active:transform-[scale(0.95)]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirmModal.userId && confirmModal.newRole) {
                    updateRole(confirmModal.userId, confirmModal.newRole);
                  }
                  setConfirmModal({ isOpen: false, action: null, userId: "", newRole: null });
                }}
                className="px-4 py-2 text-sm font-medium text-sovia-50 bg-sovia-700 hover:bg-sovia-600 rounded-lg shadow-sm transition-colors active:transform-[scale(0.95)]"
              >
                Ya, Ubah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {confirmModal.isOpen && confirmModal.action === "DELETE" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-rose-600">
                Hapus Pelanggan
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                Apakah kamu yakin ingin menghapus pelanggan ini beserta seluruh datanya? Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-50 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null, userId: "", newRole: null })}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100 bg-sovia-50 rounded-lg transition-colors border border-sovia-200 shadow-sm active:transform-[scale(0.95)]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirmModal.userId) {
                    deleteUser(confirmModal.userId);
                  }
                  setConfirmModal({ isOpen: false, action: null, userId: "", newRole: null });
                }}
                className="px-4 py-2 text-sm font-medium text-rose-50 bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors active:transform-[scale(0.95)]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingUser && (
        <ViewUserModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  )
}

function ViewUserModal({ user, onClose }: { user: User, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 bg-sovia-700 rounded-full flex items-center justify-center hover:bg-sovia-600 text-sovia-50 shadow-lg z-50 transition-all text-2xl font-light active:transform-[scale(0.95)]"
        >
          ×
        </button>

        <div className="bg-sovia-50 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
          <div className="px-6 md:px-8 py-5 border-b border-sovia-200 bg-sovia-50 shrink-0 z-10 shadow-sm relative">
            <h2 className="text-sovia-900 text-2xl font-serif">Detail Pelanggan</h2>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-sovia-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sovia-300">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-sovia-200 rounded-full overflow-hidden shadow-sm mx-auto md:mx-0">
                {user.image ? (
                  <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  <UsersIcon className="w-full h-full p-6 text-sovia-400" />
                )}
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <p className="text-sovia-500 text-sm">Nama</p>
                  <p className="text-sovia-900 text-lg font-semibold">{user.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sovia-500 text-sm">Email</p>
                  <p className="text-sovia-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sovia-500 text-sm">No. Telepon</p>
                  <p className="text-sovia-900">{user.phone || "-"}</p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-sovia-500 text-sm">Role</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === "ADMIN" ? "bg-sovia-700 text-sovia-50" : "bg-sovia-200 text-sovia-600"}`}>
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sovia-500 text-sm">Total Pesanan</p>
                    <p className="text-sovia-900 font-semibold">{user._count.orders} pesanan</p>
                  </div>
                </div>
                <div>
                  <p className="text-sovia-500 text-sm">Bergabung Sejak</p>
                  <p className="text-sovia-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-sovia-200">
              <button onClick={onClose} className="w-full py-3 border border-sovia-300 bg-sovia-100 rounded-lg text-sovia-600 hover:bg-sovia-200 transition-all active:transform-[scale(0.95)] font-medium">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleSelect({ user, onChange }: { user: User, onChange: (role: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const close = () => setIsOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [isOpen])

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (user.role !== "ADMIN") setIsOpen(!isOpen)
        }}
        disabled={user.role === "ADMIN"}
        className={`flex items-center justify-between w-24 text-sm border font-medium rounded-lg pl-3 pr-2 py-1.5 focus:outline-none transition-colors ${user.role === "ADMIN"
            ? "bg-sovia-600 text-sovia-50 border-sovia-600 opacity-90 cursor-not-allowed"
            : "bg-sovia-200 text-sovia-800 border-sovia-300 hover:bg-sovia-300"
          }`}
      >
        <span>{user.role === "ADMIN" ? "Admin" : "User"}</span>
        <ChevronDown className={`w-4 h-4 opacity-70 ${user.role === "ADMIN" ? "text-sovia-50" : "text-sovia-800"}`} />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 top-full mt-1 left-0 w-28 bg-sovia-50 border border-sovia-200 rounded-lg shadow-lg overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => {
              onChange("USER")
              setIsOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-sm text-sovia-900 hover:bg-sovia-800 hover:text-sovia-50 transition-colors"
          >
            Pelanggan
          </button>
          <button
            onClick={() => {
              onChange("ADMIN")
              setIsOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-sm text-sovia-900 hover:bg-sovia-800 hover:text-sovia-50 transition-colors"
          >
            Admin
          </button>
        </div>
      )}
    </div>
  )
}