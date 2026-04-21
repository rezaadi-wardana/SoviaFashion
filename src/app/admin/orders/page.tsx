"use client"

import { useState, useEffect } from "react"
import { Package, Truck, CheckCircle, Clock, ChevronDown } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Order {
  id: string
  status: string
  total: number
  shippingMethod: string
  address: string
  recipientName: string
  phone: string
  createdAt: string
  user: { name: string; email: string }
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
}

const statusOrder = ["PENDING_PAYMENT", "PACKING", "SHIPPED", "COMPLETED"]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

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
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-stone-900 text-3xl font-serif mb-2">Orders Management</h1>
          <p className="text-stone-700 text-sm">Manage and process customer orders.</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-stone-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-stone-500">No orders yet</div>
        ) : (
          orders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
            const Icon = statusInfo.icon
            const currentStatusIndex = statusOrder.indexOf(order.status)

            return (
              <div key={order.id} className="bg-white rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm">Order #{order.id.slice(-8)}</p>
                    <p className="text-stone-700 text-sm">{order.user.name}</p>
                    <p className="text-stone-500 text-xs">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${statusInfo.color} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                    <p className="text-stone-900 text-lg font-semibold">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {statusOrder.map((status, index) => {
                        if (index > currentStatusIndex + 1) return null
                        const sConfig = statusConfig[status]
                        const isCurrent = status === order.status
                        const isPast = index <= currentStatusIndex

                        return (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            disabled={index <= currentStatusIndex}
                            className={`px-3 py-1 rounded-full text-xs ${
                              isCurrent
                                ? sConfig.color
                                : isPast
                                ? "bg-stone-200 text-stone-600"
                                : "bg-stone-100 text-stone-400"
                            }`}
                          >
                            {sConfig.label}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-stone-600 text-sm flex items-center gap-1"
                    >
                      View Details
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-stone-700 text-sm font-medium mb-2">Shipping Details</h4>
                        <p className="text-stone-700 text-sm">{order.recipientName}</p>
                        <p className="text-stone-700 text-sm">{order.phone}</p>
                        <p className="text-stone-700 text-sm">{order.address}</p>
                        <p className="text-stone-700 text-sm mt-2">
                          Method: {order.shippingMethod === "EXPEDITION" ? "Expedition" : "COD"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-stone-700 text-sm font-medium mb-2">Items</h4>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-10 bg-stone-200 rounded">
                              <img
                                src={item.product.images || "https://placehold.co/32x40"}
                                alt={item.product.name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                            <div>
                              <p className="text-stone-700 text-sm">{item.product.name}</p>
                              <p className="text-stone-500 text-xs">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}