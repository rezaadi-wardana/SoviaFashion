"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { User, MapPin, Save, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { formatPrice, formatDate } from "@/lib/utils"

interface OrderItem {
  id: string
  status: string
  total: number
  subtotal: number
  shippingCost: number
  shippingMethod: string
  courierName: string | null
  courierService: string | null
  paymentMethod: string
  address: string
  trackingNumber: string | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    quantity: number
    price: number
    size: string | null
    color: string | null
    product: {
      id: string
      name: string
      images: string | null
    }
  }[]
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  PENDING_PAYMENT: { label: "Belum Bayar", icon: Clock, color: "text-yellow-600" },
  PACKING: { label: "Sedang Diproses", icon: Package, color: "text-blue-600" },
  SHIPPED: { label: "Dalam Perjalanan", icon: Truck, color: "text-purple-600" },
  COMPLETED: { label: "Pesanan Selesai", icon: CheckCircle, color: "text-green-600" },
  CANCELLED: { label: "Dibatalkan", icon: X, color: "text-red-600" },
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-stone-200 rounded-xl animate-pulse flex items-center justify-center">
      <p className="text-stone-400 text-sm">Memuat peta...</p>
    </div>
  ),
})

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    phone: "",
    address: "",
    lat: 0,
    lng: 0,
  })

  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile")
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orderFilter, setOrderFilter] = useState<string>("ALL")
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  async function handleCompleteOrder(orderId: string) {
    if (!window.confirm("Apakah Anda yakin telah menerima pesanan ini dengan baik?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      })
      if (res.ok) {
        toast.success("Terima kasih telah mengonfirmasi pesanan Anda!")
        fetchOrders()
      } else {
        toast.error("Gagal mengonfirmasi pesanan")
      }
    } catch (e) {
      toast.error("Terjadi kesalahan")
    }
  }

  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) {
      fetchOrders()
    }
  }, [activeTab])

  async function fetchOrders() {
    setLoadingOrders(true)
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    const userId = session?.user?.id
    const userName = session?.user?.name
    if (!userId) return

    async function loadUserData() {
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setFormData({
            name: data.name || userName || "",
            phone: data.phone || "",
            address: data.address || "",
            lat: data.lat || 0,
            lng: data.lng || 0,
          })
        }
      } catch {
        console.error("Error loading user data")
      }
    }

    loadUserData()
  }, [session])

  async function handleGetLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }))
          toast.success("Location detected!")
        },
        () => {
          toast.error("Could not get location. Please enable GPS.")
        }
      )
    } else {
      toast.error("Geolocation is not supported by your browser.")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success("Profile updated successfully!")
        await update({ name: formData.name })
      } else {
        toast.error("Failed to update profile")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-stone-400" />
          <p className="text-stone-600 text-lg">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-stone-600 text-6xl font-serif">Your Profile</h1>
          <p className="text-stone-700 text-lg mt-4 max-w-[672px]">
            Manage your personal details and delivery logistics to ensure a seamless
            editorial experience with SOVIA.
          </p>
        </div>

        <div className="flex gap-8 border-b border-stone-200 mb-12">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-4 text-lg font-medium transition-colors border-b-2 ${
              activeTab === "profile"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            Profil Saya
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 text-lg font-medium transition-colors border-b-2 ${
              activeTab === "orders"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            Pesanan Saya
          </button>
        </div>

        {activeTab === "profile" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Details */}
          <div className="bg-white rounded-lg p-12">
            <h2 className="text-stone-600 text-3xl font-serif mb-8">
              Personal Dossier
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                />
              </div>
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={session.user?.email || ""}
                  disabled
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900 opacity-60"
                />
              </div>
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+62 812 3456 7890"
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-stone-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>

          {/* Delivery Coordinates */}
          <div className="bg-white rounded-lg p-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-stone-600 text-3xl font-serif">
                Delivery Coordinates
              </h2>
              <button
                onClick={handleGetLocation}
                className="p-2 hover:bg-stone-100 rounded-lg"
                title="Get Current Location"
              >
                <MapPin className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-stone-700 text-sm block mb-2">
                  Full Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Jl. Sudirman Kav. 21, Jakarta"
                  rows={3}
                  className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-700 text-sm block mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lat: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                    placeholder="-6.2088"
                  />
                </div>
                <div>
                  <label className="text-stone-700 text-sm block mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lng: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full py-2 bg-stone-200 border-b border-stone-300/40 text-stone-900"
                    placeholder="106.8456"
                  />
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="mb-4">
              <p className="text-stone-500 text-sm mb-3">
                Klik pada peta atau geser pin untuk menentukan lokasi pengiriman
              </p>
              <MapPicker
                lat={formData.lat}
                lng={formData.lng}
                onLocationChange={(lat, lng) => {
                  setFormData((prev) => ({ ...prev, lat, lng }))
                  toast.success("Lokasi berhasil ditentukan!")
                }}
                height="h-80"
              />
            </div>
          </div>
        </div>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["ALL", "PENDING_PAYMENT", "PACKING", "SHIPPED", "COMPLETED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    orderFilter === status
                      ? "bg-stone-800 text-white"
                      : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                  }`}
                >
                  {status === "ALL" ? "Semua" : statusConfig[status].label}
                </button>
              ))}
            </div>

            {loadingOrders ? (
              <div className="py-16 flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full" />
              </div>
            ) : orders.filter(o => orderFilter === "ALL" || o.status === orderFilter).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg">
                <Package className="w-16 h-16 mx-auto mb-4 text-stone-400" />
                <p className="text-stone-600 text-lg mb-4">Belum ada pesanan</p>
                <Link
                  href="/catalog"
                  className="px-6 py-3 bg-stone-600 text-white rounded-lg inline-block"
                >
                  Mulai Belanja
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders
                  .filter(o => orderFilter === "ALL" || o.status === orderFilter)
                  .map((order) => {
                    const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
                    const Icon = statusInfo.icon

                    return (
                      <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
                        <div className="flex justify-between items-start pb-4 border-b border-stone-200 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                          <div>
                            <p className="text-stone-500 text-sm">Order #{order.id.slice(-8)}</p>
                            <p className="text-stone-700 text-sm">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-full ${statusInfo.color}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{statusInfo.label}</span>
                            </div>
                            <div className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-xs">
                              {expandedOrders.has(order.id) ? (
                                 <><ChevronUp className="w-3 h-3"/> Sembunyikan Detail</>
                              ) : (
                                 <><ChevronDown className="w-3 h-3"/> Lihat Detail Order</>
                              )}
                            </div>
                          </div>
                        </div>

                        {expandedOrders.has(order.id) && (
                          <div className="py-4 space-y-4">
                            {/* Timeline Status */}
                            <div className="bg-stone-50 p-4 rounded-lg mb-6">
                              <h4 className="text-stone-800 text-sm font-medium mb-3">Riwayat Status Pesanan</h4>
                              <div className="flex flex-col gap-2 relative">
                                 <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-stone-200"></div>
                                 <div className="flex gap-3 relative z-10">
                                    <div className="w-4 h-4 rounded-full bg-stone-400 mt-0.5 ring-4 ring-stone-50"></div>
                                    <div className="flex-1">
                                      <p className="text-stone-800 text-sm font-medium">Pesanan Dibuat</p>
                                      <p className="text-stone-500 text-xs">{formatDate(order.createdAt)}</p>
                                    </div>
                                 </div>
                                 {order.status !== "PENDING_PAYMENT" && (
                                   <div className="flex gap-3 relative z-10">
                                      <div className="w-4 h-4 rounded-full bg-stone-400 mt-0.5 ring-4 ring-stone-50"></div>
                                      <div className="flex-1">
                                        <p className="text-stone-800 text-sm font-medium">Pesanan Diproses / Dikonfirmasi</p>
                                      </div>
                                   </div>
                                 )}
                                 {(order.status === "SHIPPED" || order.status === "COMPLETED") && (
                                   <div className="flex gap-3 relative z-10">
                                      <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 ring-4 ring-stone-50"></div>
                                      <div className="flex-1">
                                        <p className="text-stone-800 text-sm font-medium">Pesanan Dalam Perjalanan</p>
                                        {order.trackingNumber && (
                                          <p className="text-stone-600 text-xs mt-1">Resi: <span className="font-mono bg-stone-200 px-1 rounded">{order.trackingNumber}</span></p>
                                        )}
                                      </div>
                                   </div>
                                 )}
                                 {order.status === "COMPLETED" && (
                                   <div className="flex gap-3 relative z-10">
                                      <div className="w-4 h-4 rounded-full bg-green-500 mt-0.5 ring-4 ring-stone-50"></div>
                                      <div className="flex-1">
                                        <p className="text-green-700 text-sm font-medium">Pesanan Selesai</p>
                                        <p className="text-stone-500 text-xs">{formatDate(order.updatedAt)}</p>
                                      </div>
                                   </div>
                                 )}
                              </div>
                            </div>

                            {order.items.map((item) => {
                              let imageUrl = "https://placehold.co/80x96/fafaf9/1c1917?text=Item"
                              if (item.product.images) {
                                try {
                                  const parsed = JSON.parse(item.product.images)
                                  if (Array.isArray(parsed) && parsed.length > 0) {
                                    imageUrl = parsed[0]
                                  } else if (typeof parsed === "string") {
                                    imageUrl = parsed
                                  }
                                } catch (e) {
                                  imageUrl = item.product.images
                                }
                              }

                              return (
                                <div key={item.id} className="flex gap-4">
                                  <div className="w-20 h-24 bg-stone-200 rounded-md flex-shrink-0 overflow-hidden">
                                    <Image
                                      src={imageUrl}
                                      alt={item.product.name}
                                      width={80}
                                      height={96}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="text-stone-900 text-lg font-serif mb-1">
                                      {item.product.name}
                                    </h3>
                                    <p className="text-stone-500 text-sm mb-2">
                                      {item.color && `Color: ${item.color}`}
                                      {item.color && item.size && ` | `}
                                      {item.size && `Size: ${item.size}`}
                                    </p>
                                    <div className="flex justify-between items-center">
                                      <span className="text-stone-700 text-sm">Qty: {item.quantity}</span>
                                      <span className="text-stone-900 font-medium">
                                        {formatPrice(item.price * item.quantity)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div className="pt-4 mt-4 border-t border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <p className="text-stone-700 text-sm font-medium mb-1">
                              Pengiriman: {order.shippingMethod === "EXPEDITION" ? "Ekspedisi" : "COD"}
                              {order.courierName && ` - ${order.courierName.toUpperCase()}`}
                              {order.courierService && ` (${order.courierService})`}
                            </p>
                            {order.trackingNumber && (
                              <p className="text-stone-600 text-sm mt-1 mb-1">No Resi: <span className="font-mono bg-stone-100 px-1 py-0.5 rounded">{order.trackingNumber}</span></p>
                            )}
                            <p className="text-stone-500 text-xs max-w-md line-clamp-2">{order.address}</p>
                          </div>
                          <div className="text-right w-full md:w-auto flex flex-col items-end gap-3">
                            <p className="text-stone-500 text-sm mb-1">Total Belanja</p>
                            <p className="text-stone-900 text-xl font-medium">
                              {formatPrice(order.total)}
                            </p>
                            {order.status === "SHIPPED" && (
                              <button
                                onClick={() => handleCompleteOrder(order.id)}
                                className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors shadow-md"
                              >
                                Pesanan Diterima
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}