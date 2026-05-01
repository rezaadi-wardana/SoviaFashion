"use client"

import { useState, useEffect } from "react"
import { Package, Truck, CheckCircle, Clock, ChevronDown, XCircle } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Order {
  id: string
  status: string
  total: number
  shippingMethod: string
  courierName: string | null
  courierService: string | null
  address: string
  recipientName: string
  phone: string
  createdAt: string
  user: { name: string; email: string }
  isConfirmed: boolean
  trackingNumber: string | null
  lat: number | null
  lng: number | null
  items: {
    id: string
    quantity: number
    product: { name: string; images: string | null }
  }[]
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  PACKING: { label: "Dalam Pengemasan", icon: Package, color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Dikirim", icon: Truck, color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Selesai", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Dibatalkan", icon: XCircle, color: "bg-accent-100 text-red-700" },
}

const statusOrder = ["PENDING_PAYMENT", "PACKING", "SHIPPED", "COMPLETED"]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/admin/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    let payload: any = { status: newStatus }

    if (newStatus === "SHIPPED") {
      const tracking = window.prompt("Masukkan nomor resi pengiriman:")
      if (!tracking) {
        toast.error("Nomor resi wajib diisi untuk mengubah status menjadi Dikirim!")
        return
      }
      payload.trackingNumber = tracking
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Order status updated")
        fetchOrders()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  async function confirmOrder(orderId: string, confirmed: boolean) {
    if (!confirmed) {
      if (!window.confirm("Apakah Anda yakin ingin menolak pesanan ini?")) return
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isConfirmed: confirmed, status: confirmed ? undefined : "CANCELLED" }),
      })

      if (res.ok) {
        toast.success(confirmed ? "Pesanan disetujui" : "Pesanan dibatalkan")
        fetchOrders()
      } else {
        toast.error("Gagal memproses pesanan")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-sovia-900 text-3xl font-serif mb-2">Orders Management</h1>
          <p className="text-sovia-700 text-sm">Manage and process customer orders.</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-sovia-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-sovia-500">No orders yet</div>
        ) : (
          orders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
            const Icon = statusInfo.icon
            const currentStatusIndex = statusOrder.indexOf(order.status)

            return (
              <div key={order.id} className="bg-[#F3EFE6] rounded-lg p-6 shadow-sm border border-sovia-100">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 border-b border-sovia-100 pb-4">
                  <div>
                    <p className="text-sovia-500 text-sm mb-1">Order #{order.id.slice(-8)}</p>
                    <p className="text-sovia-900 font-medium">{order.user.name}</p>
                    <p className="text-sovia-500 text-xs">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                    <p className="text-sovia-900 text-xl font-serif">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  {/* Items List */}
                  <div>
                    <h3 className="text-sovia-900 font-medium mb-3 text-sm">Produk yang Dipesan</h3>
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        let imageUrl = "https://placehold.co/80x96/F3EFE6/3C3228?text=Item"
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
                          <div key={item.id} className="flex items-center gap-3 bg-sovia-50 p-2 rounded">
                            <div className="w-12 h-16 bg-sovia-200 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sovia-900 text-sm font-medium line-clamp-1">{item.product.name}</p>
                              <p className="text-sovia-500 text-xs mt-1">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div>
                    <h3 className="text-sovia-900 font-medium mb-3 text-sm">Detail Pengiriman</h3>
                    <div className="bg-sovia-50 p-4 rounded text-sm space-y-2">
                      <p><span className="text-sovia-500">Penerima:</span> <span className="text-sovia-900 font-medium">{order.recipientName}</span></p>
                      <p><span className="text-sovia-500">No. HP:</span> <span className="text-sovia-900">{order.phone}</span></p>
                      <p><span className="text-sovia-500">Alamat:</span> <span className="text-sovia-900 block mt-1">{order.address}</span></p>
                      {order.lat && order.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${order.lat},${order.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-1 text-blue-600 hover:underline text-xs"
                        >
                          Buka Peta Lokasi (GPS)
                        </a>
                      )}
                      <p className="pt-2 mt-2 border-t border-sovia-200">
                        <span className="text-sovia-500">Kurir:</span>{' '}
                        <span className="text-sovia-900 font-medium">
                          {order.shippingMethod === "EXPEDITION" ? "Ekspedisi" : "COD"}
                          {order.courierName && ` - ${order.courierName.toUpperCase()}`}
                          {order.courierService && ` (${order.courierService})`}
                        </span>
                      </p>
                      {order.trackingNumber && (
                        <p>
                          <span className="text-sovia-500">No. Resi:</span>{' '}
                          <span className="text-sovia-900 font-medium tracking-wide bg-sovia-200 px-2 py-0.5 rounded">{order.trackingNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="border-t border-sovia-100 pt-4">
                  <h3 className="text-sovia-900 font-medium mb-3 text-sm">Update Status Pesanan</h3>
                  {(order.status === "PACKING" || order.status === "PENDING_PAYMENT") && !order.isConfirmed ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmOrder(order.id, true)}
                        className="px-4 py-2 bg-sovia-900 text-white rounded-lg text-xs font-medium hover:bg-sovia-800 transition-colors"
                      >
                        Setujui Pesanan
                      </button>
                      <button
                        onClick={() => confirmOrder(order.id, false)}
                        className="px-4 py-2 bg-accent-100 text-accent-500 rounded-lg text-xs font-medium hover:bg-accent-200 transition-colors"
                      >
                        Tolak Pesanan
                      </button>
                    </div>
                  ) : order.status === "CANCELLED" ? (
                    <p className="text-accent-500 text-sm font-medium">Pesanan ini telah dibatalkan.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {statusOrder.map((status, index) => {
                          const sConfig = statusConfig[status]
                          const isCurrent = status === order.status
                          const isPast = index < currentStatusIndex
                          const isNext = index === currentStatusIndex + 1

                          return (
                            <button
                              key={status}
                              onClick={() => updateOrderStatus(order.id, status)}
                              disabled={isPast || isCurrent}
                              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${
                                isCurrent
                                  ? `${sConfig.color} border-current shadow-sm`
                                  : isPast
                                  ? "bg-sovia-100 text-sovia-400 border-sovia-200 cursor-not-allowed opacity-60"
                                  : isNext
                                  ? "bg-[#F3EFE6] text-sovia-700 border-sovia-300 hover:bg-sovia-50 hover:border-sovia-400 cursor-pointer shadow-sm"
                                  : "bg-[#F3EFE6] text-sovia-400 border-sovia-200 cursor-not-allowed opacity-60"
                              }`}
                            >
                              {isPast ? "✓ " : ""}{sConfig.label}
                            </button>
                          )
                        })}
                      </div>
                      {currentStatusIndex < statusOrder.length - 1 && (
                         <p className="text-sovia-500 text-xs mt-3">
                           * Klik status selanjutnya untuk memperbarui progres pesanan.
                         </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}