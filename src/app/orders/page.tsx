"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Package, Truck, CheckCircle, Clock } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"

interface OrderItem {
  id: string
  status: string
  total: number
  subtotal: number
  shippingCost: number
  shippingMethod: string
  paymentMethod: string
  address: string
  createdAt: string
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
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", icon: Clock, color: "text-yellow-600" },
  PACKING: { label: "Dalam Pengemasan", icon: Package, color: "text-blue-600" },
  SHIPPED: { label: "Dikirim", icon: Truck, color: "text-purple-600" },
  COMPLETED: { label: "Selesai", icon: CheckCircle, color: "text-green-600" },
  CANCELLED: { label: "Dibatalkan", icon: X, color: "text-red-600" },
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchOrders()
    }
  }, [session])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders")
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-stone-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 text-lg mb-4">Please sign in to view your orders</p>
          <Link href="/auth/signin" className="px-6 py-3 bg-stone-600 text-white rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-8">
        <h1 className="text-stone-900 text-4xl font-serif mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600 text-lg mb-4">No orders yet</p>
            <Link
              href="/catalog"
              className="px-6 py-3 bg-stone-600 text-white rounded-lg inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
              const Icon = statusInfo.icon

              return (
                <div key={order.id} className="bg-white rounded-lg p-6">
                  <div className="flex justify-between items-start pb-4 border-b border-stone-200">
                    <div>
                      <p className="text-stone-500 text-sm">Order #{order.id.slice(-8)}</p>
                      <p className="text-stone-700 text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="py-4 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-24 bg-stone-200 rounded flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.product.images || "https://placehold.co/80x96/fafaf9/1c1917?text=Item"}
                            alt={item.product.name}
                            width={80}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-stone-900 text-lg font-serif">
                            {item.product.name}
                          </h3>
                          <p className="text-stone-700 text-sm">
                            {item.color && `Color: ${item.color}`}
                            {item.size && ` | Size: ${item.size}`}
                          </p>
                          <div className="flex justify-between mt-2">
                            <span className="text-stone-700 text-sm">Qty: {item.quantity}</span>
                            <span className="text-stone-900 font-medium">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex justify-between">
                    <div>
                      <p className="text-stone-700 text-sm">
                        Shipping: {order.shippingMethod === "EXPEDITION" ? "Expedition" : "COD"}
                      </p>
                      <p className="text-stone-700 text-xs">{order.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-stone-900 text-lg font-medium">
                        Total: {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}