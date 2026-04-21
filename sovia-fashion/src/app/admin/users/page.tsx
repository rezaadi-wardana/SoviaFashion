"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Users as UsersIcon, Crown } from "lucide-react"
import { formatDate } from "@/lib/utils"

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
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating role:", error)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-stone-900 text-3xl font-serif mb-2">Customer Management</h1>
          <p className="text-stone-700 text-sm">
            View and manage registered customers.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md pl-4 pr-4 py-3 bg-stone-200/30 rounded-lg text-sm"
        />
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-16 text-stone-500">Loading...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-stone-500">No users found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-stone-200 rounded-full overflow-hidden">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UsersIcon className="w-full h-full p-3 text-stone-400" />
                  )}
                </div>
                <div>
                  <p className="text-stone-900 font-medium">{user.name || "No name"}</p>
                  <p className="text-stone-500 text-sm">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Phone</span>
                  <span className="text-stone-700">{user.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Joined</span>
                  <span className="text-stone-700">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Orders</span>
                  <span className="text-stone-700">{user._count.orders}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                  <span className="text-stone-500">Role</span>
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="text-sm bg-stone-100 rounded px-2 py-1"
                    disabled={user.role === "ADMIN"}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}